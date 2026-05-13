import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '@/lib/prompts';
import { extractNumbersFromScript, detectForeignNumbers } from '@/lib/script-numbers';
import { logThumbnailGeneration } from '@/lib/logger';
import { createServerSupabaseClient } from '@/lib/supabase-server';
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
// RAG: embeddings.json による類似度ベース選出
// ============================================================
interface EmbeddingEntry {
  name: string;
  mtimeMs: number;
  fileSize: number;
  description: string;
  vector: number[];
  generatedAt: string;
}
interface EmbeddingsFile {
  model: string;
  embeddingModel: string;
  entries: EmbeddingEntry[];
}

// embeddings.json のメモリキャッシュ
let embeddingsCache: EmbeddingsFile | null = null;
let embeddingsLoadedAt: number = 0;
const EMBEDDINGS_TTL = 5 * 60 * 1000; // 5分

function loadEmbeddings(): EmbeddingsFile | null {
  // キャッシュが有効なら返却
  if (embeddingsCache && Date.now() - embeddingsLoadedAt < EMBEDDINGS_TTL) {
    return embeddingsCache;
  }
  try {
    const p = path.join(process.cwd(), 'public', 'training', 'embeddings.json');
    if (!fs.existsSync(p)) return null;
    const data = JSON.parse(fs.readFileSync(p, 'utf-8')) as EmbeddingsFile;
    embeddingsCache = data;
    embeddingsLoadedAt = Date.now();
    return data;
  } catch (e) {
    console.error('[rag] embeddings.json load failed:', e);
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 原稿をベクトル化して、最も類似する学習画像を選出
 * 80%: 類似度 TOP / 20%: ランダム多様性
 */
async function selectByRAG(
  script: string,
  allFiles: { name: string; mtimeMs: number }[],
  limit: number,
  apiKey: string
): Promise<{ name: string; mtimeMs: number; ragScore?: number }[] | null> {
  const embeddings = loadEmbeddings();
  if (!embeddings || embeddings.entries.length === 0) {
    return null; // RAG が使えない場合、null を返してフォールバック
  }

  // embeddings.json と現存ファイルの突合（差分は無視して、両方に存在するもののみ使う）
  const fileNameSet = new Set(allFiles.map((f) => f.name));
  const usableEntries = embeddings.entries.filter((e) => fileNameSet.has(e.name));

  if (usableEntries.length === 0) {
    console.log('[rag] embeddings と画像ファイルが一致しません、フォールバック');
    return null;
  }

  if (usableEntries.length <= limit) {
    // 全部使う
    return usableEntries.map((e) => ({
      name: e.name,
      mtimeMs: allFiles.find((f) => f.name === e.name)?.mtimeMs || 0,
    }));
  }

  try {
    // 1. 原稿をベクトル化（先頭8000文字に制限）
    const truncated = script.slice(0, 8000);
    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: embeddings.embeddingModel || 'text-embedding-3-small',
        input: truncated,
      }),
    });

    if (!resp.ok) {
      console.error('[rag] embedding API failed:', resp.status);
      return null;
    }

    const json = await resp.json();
    const queryVector = json.data?.[0]?.embedding;
    if (!queryVector) return null;

    // 2. 各画像との類似度を計算
    const scored = usableEntries.map((e) => ({
      name: e.name,
      mtimeMs: allFiles.find((f) => f.name === e.name)?.mtimeMs || 0,
      score: cosineSimilarity(queryVector, e.vector),
    }));

    // 3. 類似度TOP 80% + ランダム多様性 20%
    scored.sort((a, b) => b.score - a.score);
    const topQuota = Math.ceil(limit * 0.8);
    const topPicks = scored.slice(0, topQuota);
    const remaining = scored.slice(topQuota);
    const randomPicks = shuffle(remaining).slice(0, limit - topQuota);

    console.log(
      `[rag] script-based selection (top scores: ${topPicks
        .map((p) => `${p.name}:${p.score.toFixed(3)}`)
        .join(', ')})`
    );

    return [...topPicks, ...randomPicks].map((p) => ({
      name: p.name,
      mtimeMs: p.mtimeMs,
      ragScore: p.score,
    }));
  } catch (e) {
    console.error('[rag] failed:', e);
    return null;
  }
}

// ============================================================
// メモリキャッシュ（warm start 中に保持される）
// ============================================================
type TrainingFile = { base64: string; mime: string; name: string; mtimeMs: number };
let trainingCache: Map<string, TrainingFile> = new Map();
let cacheValidationKey: string | null = null;

/**
 * 学習画像の読み込み（RAG + キャッシュ + 並列I/O 最適化版）
 *
 * 動作:
 * 1. フォルダ内のファイル一覧を取得
 * 2. script が指定されていて embeddings.json があれば RAG 検索（類似度80% + ランダム20%）
 * 3. RAG が使えない場合は新しい順80% + ランダム20%にフォールバック
 * 4. キャッシュヒット → メモリから即返却（数ミリ秒）
 * 5. キャッシュミス → 並列にファイル読み込み・base64化してキャッシュ
 */
async function loadTrainingImages(
  script?: string,
  apiKey?: string
): Promise<TrainingFile[]> {
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

    // 抽出ロジック: RAG が使えるなら類似度ベース、そうでなければ新しい順
    let selected: { name: string; mtimeMs: number; ragScore?: number }[] | null = null;
    let selectionMode = 'recency-random'; // ログ用

    if (script && apiKey) {
      const ragResult = await selectByRAG(script, allFiles, TRAINING_PER_REQUEST, apiKey);
      if (ragResult) {
        selected = ragResult;
        selectionMode = 'rag-similarity';
      }
    }

    // フォールバック: 新しい順80% + ランダム20%
    if (!selected) {
      selected = selectTrainingImages(allFiles, TRAINING_PER_REQUEST);
    }

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
      `[training] mode=${selectionMode}, pool=${allFiles.length}, selected=${selected.length}, ${cacheStatus}: ${selected
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
        thumbnails: {
          type: 'array',
          description:
            'サムネ案。必ず3つ生成。各thumbnailは独立した訴求軸で差別化する。',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: {
                type: 'string',
                description: '方向性ラベル（例: 強インパクト型・恐怖訴求 / 強キラーワード型 など）',
              },
              thumbnailText: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  badge: {
                    type: 'string',
                    description:
                      '吹き出し型の煽り文句。2〜10文字。例「※ガチで早くやれw」「本当は」「スマホだけ」「10分で」。不要な場合のみ空文字。',
                  },
                  headline: {
                    type: 'string',
                    description:
                      '上段テキスト。テーマ・カテゴリ・対象者を示す短いフレーズ。2〜10文字。例「AI×動物」「新 楽天ROOM」「99%が知らない」「シニアでも」。不要な場合のみ空文字。',
                  },
                  mainCopy: {
                    type: 'string',
                    description:
                      '最大文字のメインコピー。6〜14文字。最強パワーワード。例「教えたくない」「自動収益」「コピペで日給1万」「マジで儲かりすぎw」「いきなり50万!?」。必須。',
                  },
                  subCopy: {
                    type: 'string',
                    description:
                      '下段テキスト。メリット・結果・補足。6〜18文字。例「月60万超えました」「もうずっと儲かる」「シニアでも出来る」「ガチで儲かる副業5選」。不要な場合のみ空文字。',
                  },
                  marker: {
                    type: 'string',
                    description:
                      '黄色マーカー強調語。1〜4文字。badge/headline/mainCopy/subCopy のいずれかに既に含まれている単語であること。数字・金額が最適。',
                  },
                },
                required: ['badge', 'headline', 'mainCopy', 'subCopy', 'marker'],
              },
              imagePrompt: {
                type: 'string',
                description:
                  'GPT Image 2用の英語プロンプト(500語以上)。1280x720で構図、main/sub日本語をダブルクォートで指定、構図パターン・配色・文字配置を明記。',
              },
            },
            required: ['label', 'thumbnailText', 'imagePrompt'],
          },
        },
      },
      required: ['thumbnails'],
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    // === 認証チェック ===
    // middleware で守られているはずだが、API routeでも念のため二重ガード。
    // 未ログインの場合は401を返す。
    const supabaseAuth = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です。ログインしてください。' },
        { status: 401 }
      );
    }
    const userId = user.id;

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

    // 高CTR成功サムネを読み込む（RAG + キャッシュ + 並列I/O 最適化版）
    // script があれば類似度検索（RAG）、なければ新しい順80%+ランダム20%
    const trainingImages = await loadTrainingImages(data.script, apiKey);
    // buildPrompt に枚数を渡して、プロンプト側で「最初の N 枚は学習用」と明示
    data.trainingImageCount = trainingImages.length;

    // 原稿から「使用可能な数字」を抽出してホワイトリスト化。
    // これにより、AIが原稿に存在しない数字（例: 524,758円）をサムネに描画する事故を防ぐ。
    const extractedNumbers = extractNumbersFromScript(data.script || '');
    data.extractedNumbers = extractedNumbers;
    console.log(
      `[numbers] extracted ${extractedNumbers.all.length} unique numbers from script:`,
      extractedNumbers.all
    );

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

    const gptStartTime = Date.now();
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
          // reasoning_effort: 'low' で推論時間を大幅短縮（high → low で約3〜4倍速)。
          // サムネ生成は「正解が一つに決まらない創造的タスク」のため、
          // 深い推論よりも、明確なルールに従った高速生成の方が品質も体感速度も良い。
          reasoning_effort: 'low',
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
    const gptElapsed = ((Date.now() - gptStartTime) / 1000).toFixed(1);
    console.log(`[gpt-5] reasoning=low, took ${gptElapsed}s (input chars: ${(userContent || '').length})`);
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

    // === 数字違反の検証 ===
    // 生成されたサムネテキスト・画像プロンプト内に、ホワイトリスト外の数字が混入していないかチェック。
    // 違反があった場合はログ出力（クライアントには警告として返す。生成自体はブロックしない）。
    const violations: Array<{ thumbnailIndex: number; field: string; foreign: string[] }> = [];
    if (Array.isArray(parsed?.thumbnails)) {
      parsed.thumbnails.forEach((th: any, idx: number) => {
        const fields: Array<[string, string]> = [
          ['badge', th?.thumbnailText?.badge || ''],
          ['headline', th?.thumbnailText?.headline || ''],
          ['mainCopy', th?.thumbnailText?.mainCopy || ''],
          ['subCopy', th?.thumbnailText?.subCopy || ''],
          ['marker', th?.thumbnailText?.marker || ''],
          ['imagePrompt', th?.imagePrompt || ''],
        ];
        for (const [name, val] of fields) {
          const foreign = detectForeignNumbers(val, extractedNumbers);
          if (foreign.length > 0) {
            violations.push({ thumbnailIndex: idx, field: name, foreign });
          }
        }
      });
    }
    if (violations.length > 0) {
      console.warn(
        '[numbers] ⚠️ 原稿外の数字が検出されました（再生成を検討してください）:',
        JSON.stringify(violations, null, 2)
      );
      parsed._numberWarnings = violations;
    } else {
      console.log('[numbers] ✅ 全サムネで原稿の数字のみ使用されています');
    }

    // === ログ保存 ===
    // 生成のリクエスト/レスポンス/警告をSupabaseに保存。
    // 失敗してもレスポンス自体は止めない（fire-and-forget）。
    // 戻り値のログIDをレスポンスに含めて、後で「採用」フラグ立て等に使えるようにする。
    const logId = await logThumbnailGeneration({
      script: data.script || '',
      inputData: data,
      extractedNumbers,
      gptOutput: parsed,
      numberWarnings: violations.length > 0 ? violations : null,
      trainingImageCount: trainingImages.length,
      trainingMode: data.script ? 'rag-similarity' : 'random',
      userId, // ログイン中のユーザーIDを紐付け
    });
    if (logId) {
      parsed._logId = logId;
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '不明なエラー' },
      { status: 500 }
    );
  }
}
