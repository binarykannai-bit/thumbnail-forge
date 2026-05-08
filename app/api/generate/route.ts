import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '@/lib/prompts';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * public/training/ フォルダから高CTR成功サムネを読み込んで base64 化する。
 * これらは毎回の生成で参考画像として AI に学習させる。
 *
 * 仕様:
 * - 対応形式: jpg, jpeg, png, webp
 * - フォルダ内の画像数に上限なし（何百枚でもOK）
 * - 1リクエストあたり最大 TRAINING_PER_REQUEST 枚を選出（デフォルト10枚）
 * - 抽出ロジック: 新しい順80% + ランダム20%
 *   - ファイル更新日時で新しい順にソート
 *   - 80%枠: 新しい順の上位 (TRAINING_PER_REQUEST * 0.8) 枚から選ぶ
 *   - 20%枠: 残り全体からランダムに (TRAINING_PER_REQUEST * 0.2) 枚
 * - フォルダがない・空の場合は空配列を返す
 */
const TRAINING_PER_REQUEST = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectTrainingImages(
  allFiles: { name: string; mtimeMs: number }[],
  limit: number
): { name: string; mtimeMs: number }[] {
  if (allFiles.length === 0) return [];
  if (allFiles.length <= limit) return allFiles;

  // 新しい順にソート (mtimeMs 降順)
  const sorted = [...allFiles].sort((a, b) => b.mtimeMs - a.mtimeMs);

  // 80%枠: 新しい順の上位から
  const recentQuota = Math.ceil(limit * 0.8);  // 10枚なら8枚
  const recentPool = sorted.slice(0, Math.min(recentQuota, sorted.length));
  const recentPicks = shuffle(recentPool).slice(0, recentQuota);

  // 残り全体プールからランダム
  const randomQuota = limit - recentPicks.length;  // 10枚なら2枚
  const recentPickNames = new Set(recentPicks.map((f) => f.name));
  const remaining = sorted.filter((f) => !recentPickNames.has(f.name));
  const randomPicks = shuffle(remaining).slice(0, randomQuota);

  // 結合（新しい順を先頭に）
  return [...recentPicks, ...randomPicks].sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function loadTrainingImages(): { base64: string; mime: string; name: string }[] {
  try {
    const dir = path.join(process.cwd(), 'public', 'training');
    if (!fs.existsSync(dir)) return [];

    const allFiles = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map((name) => {
        const stat = fs.statSync(path.join(dir, name));
        return { name, mtimeMs: stat.mtimeMs };
      });

    if (allFiles.length === 0) return [];

    const selected = selectTrainingImages(allFiles, TRAINING_PER_REQUEST);

    console.log(
      `[training] pool=${allFiles.length}, selected=${selected.length}: ${selected
        .map((f) => f.name)
        .join(', ')}`
    );

    return selected.map((f) => {
      const buf = fs.readFileSync(path.join(dir, f.name));
      const ext = path.extname(f.name).slice(1).toLowerCase();
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      return {
        base64: buf.toString('base64'),
        mime: `image/${mime}`,
        name: f.name,
      };
    });
  } catch (e) {
    console.error('[training] load failed:', e);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'サーバー側でOPENAI_API_KEYが未設定です。Vercelの環境変数を確認してください。' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: '入力データがありません。' }, { status: 400 });
    }

    // 高CTR成功サムネを読み込む
    const trainingImages = loadTrainingImages();
    // buildPrompt に枚数を渡して、プロンプト側で「最初の N 枚は学習用」と明示
    data.trainingImageCount = trainingImages.length;

    const prompt = buildPrompt(data);

    // Build OpenAI message content with images
    // 順序: [training] → [user refs] → [visualAssets] → [text prompt]
    const userContent: any[] = [];

    // 1. 高CTR成功サムネ（学習用・最優先）
    trainingImages.forEach((img) => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mime};base64,${img.base64}` },
      });
    });

    // 2. ユーザーがアップした参考サムネ
    (data.refs || []).forEach((ref: any) => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${ref.mediaType};base64,${ref.base64}` },
      });
    });

    // 3. ビジュアル素材（顔写真・キャラクター画像など）
    (data.visualAssets || []).forEach((asset: any) => {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${asset.mediaType};base64,${asset.base64}` },
      });
    });

    userContent.push({ type: 'text', text: prompt });

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'あなたはYouTubeサムネイル戦略の最高峰の専門家です。日本のYouTube市場における視聴者心理学・CTR最適化・コピーライティングに精通しています。出力は必ずJSON形式のみで、それ以外の前置き・コメント・コードブロック記号は一切含めないでください。',
          },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `OpenAI API エラー (${resp.status}): ${errText.slice(0, 500)}` },
        { status: resp.status }
      );
    }

    const json = await resp.json();
    const text = json.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else
        return NextResponse.json(
          { error: 'JSON解析失敗。GPTの出力が想定形式と異なります。', raw: clean.slice(0, 500) },
          { status: 500 }
        );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '不明なエラー' },
      { status: 500 }
    );
  }
}
