import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '@/lib/prompts';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * public/training/ フォルダから高CTR成功サムネを読み込んで base64 化する。
 * これらは毎回の生成で参考画像として AI に学習させる。
 *
 * 仕様:
 * - 対応形式: jpg, jpeg, png, webp
 * - フォルダ内の画像数に上限なし（何百枚でもOK）
 * - 1リクエストあたり最大 TRAINING_PER_REQUEST 枚を選出（デフォルト5枚・detail:'high'で詳細認識）
 * - 抽出ロジック: 新しい順80% + ランダム20%
 *   - ファイル更新日時で新しい順にソート
 *   - 80%枠: 新しい順の上位 (TRAINING_PER_REQUEST * 0.8) 枚から選ぶ
 *   - 20%枠: 残り全体からランダムに (TRAINING_PER_REQUEST * 0.2) 枚
 * - フォルダがない・空の場合は空配列を返す
 */
const TRAINING_PER_REQUEST = 5;

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

  // 80%枠: 新しい順の上位から固定で取る（無意味な shuffle は廃止）
  const recentQuota = Math.ceil(limit * 0.8);
  const recentPicks = sorted.slice(0, Math.min(recentQuota, sorted.length));

  // 残り全体プールからランダム
  const randomQuota = limit - recentPicks.length;
  const recentNames = new Set(recentPicks.map((f) => f.name));
  const remaining = sorted.filter((f) => !recentNames.has(f.name));
  const randomPicks = shuffle(remaining).slice(0, randomQuota);

  // 結合（新しい順を先頭に）
  return [...recentPicks, ...randomPicks].sort((a, b) => b.mtimeMs - a.mtimeMs);
}

// ============================================================
// メモリキャッシュ（warm start 中に保持される）
// ============================================================
type TrainingFile = { base64: string; mime: string; name: string; mtimeMs: number };
let trainingCache: Map<string, TrainingFile> = new Map();
let cacheValidationKey: string | null = null;

/**
 * 学習画像の読み込み（キャッシュ + 並列I/O 最適化版）
 *
 * 動作:
 * 1. フォルダ内のファイル一覧を取得
 * 2. キャッシュ検証キー（ファイル名+mtime）を比較
 * 3. キャッシュヒット → メモリから即返却（数ミリ秒）
 * 4. キャッシュミス → 並列にファイル読み込み・base64化してキャッシュ
 * 5. 選出ロジックは毎回実行（ランダム20%枠のため）
 */
async function loadTrainingImages(): Promise<TrainingFile[]> {
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

    // キャッシュ検証キー: ファイル名と更新日時の組合せ
    const validationKey = allFiles
      .map((f) => `${f.name}:${f.mtimeMs}`)
      .sort()
      .join('|');

    // 抽出（毎回ランダム要素があるため、選出は必ず実行）
    const selected = selectTrainingImages(allFiles, TRAINING_PER_REQUEST);

    // キャッシュ無効化が必要かチェック
    if (cacheValidationKey !== validationKey) {
      trainingCache.clear();
      cacheValidationKey = validationKey;
    }

    // 選ばれた画像のうち、キャッシュにないものだけを並列で読み込み
    const toLoad = selected.filter((f) => !trainingCache.has(f.name));

    if (toLoad.length > 0) {
      const loaded = await Promise.all(
        toLoad.map(async (f) => {
          const buf = await fs.promises.readFile(path.join(dir, f.name));
          const ext = path.extname(f.name).slice(1).toLowerCase();
          const mime = ext === 'jpg' ? 'jpeg' : ext;
          return {
            name: f.name,
            mtimeMs: f.mtimeMs,
            base64: buf.toString('base64'),
            mime: `image/${mime}`,
          } as TrainingFile;
        })
      );
      loaded.forEach((file) => trainingCache.set(file.name, file));
    }

    const cacheStatus =
      toLoad.length === 0 ? 'cache-hit' : `cache-miss(${toLoad.length} loaded)`;
    console.log(
      `[training] pool=${allFiles.length}, selected=${selected.length}, ${cacheStatus}: ${selected
        .map((f) => f.name)
        .join(', ')}`
    );

    return selected.map((f) => trainingCache.get(f.name)!);
  } catch (e) {
    console.error('[training] load failed:', e);
    return [];
  }
}

/**
 * 出力JSONスキーマ（Structured Outputs / strict mode）
 *
 * このスキーマにより、OpenAI 側で以下が強制的に保証される:
 * - linkedTitleIndex は必ず 0, 1, 2 のいずれか（enum）
 * - trigger は必ず5つのトリガー型のいずれか（enum）
 * - expectedCTR は必ず 高/中高/中 のいずれか（enum）
 * - 必須フィールドの欠落不可（required）
 * - 余計なフィールドの混入不可（additionalProperties: false）
 *
 * 注意: array の minItems/maxItems は OpenAI strict mode の限定サポート
 * 範囲外のため指定していない。配列件数(titles=3個・thumbnails=3個)は
 * プロンプト側で強く指示することで担保している。
 *
 * 結果としてJSON解析エラーがゼロになり、フィールド漏れもなくなる。
 */
const RESPONSE_SCHEMA = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'thumbnail_generation_response',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        titles: {
          type: 'array',
          description: 'YouTubeタイトル案。必ず3つ生成。検索ワード+数字+感情訴求の構造を厳守。',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              text: {
                type: 'string',
                description:
                  'タイトル本文。40文字以内。「検索キーワード(先頭)+数字+感情訴求」の構造を必ず守る。',
              },
              trigger: {
                type: 'string',
                enum: [
                  '知らないと損型',
                  '驚き＋利益型',
                  '共感＋逆転型',
                  '結論先出し型',
                  '問題提起型',
                ],
                description: '心理トリガー型。3つのタイトルで全部異なる型を使うこと。',
              },
              structure: {
                type: 'string',
                description:
                  '構造の自己証明。「検索ワード:○○ / 数字:○○ / 感情訴求:○○」形式で記述。',
              },
              expectedCTR: {
                type: 'string',
                enum: ['高', '中高', '中'],
                description: '想定CTR評価。',
              },
            },
            required: ['text', 'trigger', 'structure', 'expectedCTR'],
          },
        },
        thumbnails: {
          type: 'array',
          description:
            'サムネ案。必ず3つ生成。各thumbnailは同じインデックスのtitleと1対1で連動させる。',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: {
                type: 'string',
                description: '方向性ラベル（例: 強インパクト型・恐怖訴求 / 強キラーワード型 など）',
              },
              linkedTitleIndex: {
                type: 'integer',
                enum: [0, 1, 2],
                description:
                  '対応するtitlesのインデックス。thumbnails[0]→0, [1]→1, [2]→2。同インデックスのタイトルと訴求軸・キーワードを連動させる。',
              },
              thumbnailText: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  main: {
                    type: 'string',
                    description:
                      'メインコピー。8〜12文字。完結した日本語。パワーワード+メリット要素含む。',
                  },
                  sub: {
                    type: 'string',
                    description:
                      'サブコピー。8〜15文字。完結した日本語（助詞で途中終了禁止）。空文字も可。',
                  },
                  marker: {
                    type: 'string',
                    description:
                      '黄色マーカー強調語。1〜4文字。対応titleの数字・固有名詞と一致させる。',
                  },
                },
                required: ['main', 'sub', 'marker'],
              },
              imagePrompt: {
                type: 'string',
                description:
                  'GPT Image 2用の英語プロンプト(500語以上)。1280x720で構図、main/sub日本語をダブルクォートで指定、構図パターン・配色・文字配置を明記。',
              },
            },
            required: ['label', 'linkedTitleIndex', 'thumbnailText', 'imagePrompt'],
          },
        },
      },
      required: ['titles', 'thumbnails'],
    },
  },
};

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
    // 高CTR成功サムネを読み込む（キャッシュ + 並列I/O 最適化版）
    const trainingImages = await loadTrainingImages();
    // buildPrompt に枚数を渡して、プロンプト側で「最初の N 枚は学習用」と明示
    data.trainingImageCount = trainingImages.length;

    const prompt = buildPrompt(data);

    // Build OpenAI message content with images
    // 順序: [training] → [user refs] → [visualAssets] → [text prompt]
    const userContent: any[] = [];

    // 1. 高CTR成功サムネ（学習用・最優先）
    // detail: 'high' で送信（フォント・装飾・色まで詳細に認識させて学習効果を最大化）
    trainingImages.forEach((img) => {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mime};base64,${img.base64}`,
          detail: 'high',
        },
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

    // OpenAI 呼び出しに 250 秒のタイムアウト（function maxDuration 300秒の余裕を持たせる）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 250000);

    let resp;
    try {
      resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-5',
          response_format: RESPONSE_SCHEMA,
          messages: [
            {
              role: 'system',
              content:
                'あなたはYouTubeサムネイル戦略の最高峰の専門家です。日本のYouTube市場における視聴者心理学・CTR最適化・コピーライティングに精通しています。出力は提供されたJSONスキーマに厳密に従ってください。',
            },
            { role: 'user', content: userContent },
          ],
        }),
      });
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        return NextResponse.json(
          { error: 'OpenAI APIの応答が250秒以内に返ってきませんでした。原稿が長すぎるか、学習画像が多すぎる可能性があります。少し短くしてお試しください。' },
          { status: 504 }
        );
      }
      throw e;
    }
    clearTimeout(timeoutId);

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

    // _debug 情報は廃止（フロントで使われていないため、レスポンスから除外）
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '不明なエラー' },
      { status: 500 }
    );
  }
}
