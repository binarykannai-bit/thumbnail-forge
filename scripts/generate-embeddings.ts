/**
 * 学習画像の説明文 + Embedding を生成するスクリプト
 *
 * 実行方法:
 *   OPENAI_API_KEY=sk-xxx npx tsx scripts/generate-embeddings.ts
 *
 * 動作:
 * 1. public/training/ の全画像をスキャン
 * 2. embeddings.json と差分比較（新規・削除を検出）
 * 3. 新規画像: GPT-4o-mini で説明文を生成 → text-embedding-3-small でベクトル化
 * 4. 削除された画像: embeddings.json から除去
 * 5. embeddings.json を更新
 *
 * モデル:
 * - 説明文生成: gpt-4o-mini ($0.15/1M input tokens)
 * - Embedding: text-embedding-3-small ($0.02/1M tokens)
 * - 100枚で約 $0.05 程度
 */

import * as fs from 'fs';
import * as path from 'path';

const TRAINING_DIR = path.join(process.cwd(), 'public', 'training');
const EMBEDDINGS_PATH = path.join(TRAINING_DIR, 'embeddings.json');
const VISION_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';

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

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY が設定されていません');
    process.exit(1);
  }

  // 1. 学習画像の一覧を取得
  if (!fs.existsSync(TRAINING_DIR)) {
    console.error(`❌ ${TRAINING_DIR} が見つかりません`);
    process.exit(1);
  }

  const currentFiles = fs
    .readdirSync(TRAINING_DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map((name) => {
      const stat = fs.statSync(path.join(TRAINING_DIR, name));
      return { name, mtimeMs: stat.mtimeMs, fileSize: stat.size };
    });

  console.log(`📂 学習画像: ${currentFiles.length}枚`);

  // 2. 既存の embeddings.json を読み込み
  let existing: EmbeddingsFile = {
    model: VISION_MODEL,
    embeddingModel: EMBEDDING_MODEL,
    entries: [],
  };

  if (fs.existsSync(EMBEDDINGS_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
      console.log(`📄 既存 embeddings.json: ${existing.entries.length}件`);
    } catch (e) {
      console.warn('⚠️ 既存ファイルの読み込みに失敗、新規作成します');
    }
  }

  // 3. 差分検出
  const existingMap = new Map(existing.entries.map((e) => [e.name, e]));
  const currentNames = new Set(currentFiles.map((f) => f.name));

  // 新規 or 更新が必要なファイル（mtimeかサイズが変わっている）
  const toProcess = currentFiles.filter((f) => {
    const ex = existingMap.get(f.name);
    if (!ex) return true; // 新規
    if (ex.mtimeMs !== f.mtimeMs || ex.fileSize !== f.fileSize) return true; // 変更
    return false;
  });

  // 削除すべきファイル
  const toRemove = existing.entries.filter((e) => !currentNames.has(e.name));

  console.log(`\n📊 差分:`);
  console.log(`  新規/更新: ${toProcess.length}件`);
  console.log(`  削除:     ${toRemove.length}件`);
  console.log(`  変更なし: ${existing.entries.length - toRemove.length}件`);

  if (toProcess.length === 0 && toRemove.length === 0) {
    console.log('\n✅ 変更なし。embeddings.json は最新です。');
    return;
  }

  // 4. 新規・更新ファイルを処理
  const newEntries: EmbeddingEntry[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const f = toProcess[i];
    console.log(`\n[${i + 1}/${toProcess.length}] 処理中: ${f.name}`);

    try {
      // 4-1. 画像を base64 化
      const buf = fs.readFileSync(path.join(TRAINING_DIR, f.name));
      const ext = path.extname(f.name).slice(1).toLowerCase();
      const mime = ext === 'jpg' ? 'jpeg' : ext;
      const dataUrl = `data:image/${mime};base64,${buf.toString('base64')}`;

      // 4-2. GPT-4o-mini で説明文を生成
      console.log('  🤖 説明文を生成中...');
      const descResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'あなたはYouTubeサムネ分析の専門家です。提供されたYouTubeサムネ画像を分析し、以下の観点で150〜200文字の日本語で説明してください: (1) ジャンル・テーマ (2) 主なキーワード・固有名詞 (3) 訴求軸（金銭/時間/不安解消/問題解決/知識/競争優位など）(4) 視覚的特徴（色味・構図・人物の有無）(5) 含まれる数字・金額。説明文のみを返してください。前置きは不要です。',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: dataUrl, detail: 'high' },
                },
                { type: 'text', text: 'このサムネを分析してください' },
              ],
            },
          ],
          max_tokens: 400,
        }),
      });

      if (!descResp.ok) {
        const err = await descResp.text();
        throw new Error(`説明文生成失敗: ${descResp.status} ${err.slice(0, 200)}`);
      }

      const descJson = await descResp.json();
      const description = descJson.choices?.[0]?.message?.content?.trim() || '';
      if (!description) throw new Error('説明文が空でした');
      console.log(`  📝 説明文: ${description.slice(0, 80)}...`);

      // 4-3. Embedding 生成
      console.log('  🔢 ベクトル化中...');
      const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: description,
        }),
      });

      if (!embedResp.ok) {
        const err = await embedResp.text();
        throw new Error(`Embedding失敗: ${embedResp.status} ${err.slice(0, 200)}`);
      }

      const embedJson = await embedResp.json();
      const vector = embedJson.data?.[0]?.embedding;
      if (!vector || !Array.isArray(vector)) throw new Error('ベクトルが空でした');
      console.log(`  ✅ 完了 (${vector.length}次元)`);

      newEntries.push({
        name: f.name,
        mtimeMs: f.mtimeMs,
        fileSize: f.fileSize,
        description,
        vector,
        generatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error(`  ❌ ${f.name} の処理に失敗: ${e.message}`);
      console.error(`     スキップして続行します`);
    }
  }

  // 5. embeddings.json を更新
  // 変更がなかった既存エントリ + 新規エントリ
  const unchangedEntries = existing.entries.filter((e) => {
    const cur = currentFiles.find((f) => f.name === e.name);
    return cur && cur.mtimeMs === e.mtimeMs && cur.fileSize === e.fileSize;
  });

  const finalEntries = [...unchangedEntries, ...newEntries].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const output: EmbeddingsFile = {
    model: VISION_MODEL,
    embeddingModel: EMBEDDING_MODEL,
    entries: finalEntries,
  };

  fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ embeddings.json を更新しました`);
  console.log(`   合計: ${finalEntries.length}件`);
  console.log(`   ファイル: ${EMBEDDINGS_PATH}`);
}

main().catch((e) => {
  console.error('❌ エラー:', e);
  process.exit(1);
});
