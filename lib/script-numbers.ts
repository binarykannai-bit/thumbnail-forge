/**
 * 原稿から「サムネで使用可能な数字」を抽出する。
 *
 * 目的:
 * - サムネ生成AIが、原稿に存在しない数字（例:「524,758円」）を勝手に画像に描画してしまう問題を防ぐ
 * - 抽出した数字を「ホワイトリスト」としてプロンプトに渡し、それ以外の数字使用を禁じる
 *
 * 抽出対象:
 * 1. 金額: 「月100万円」「3万円」「524,758円」「¥305,778」「100ドル」
 * 2. 期間: 「3年」「5分」「10日」「2時間」「半年」
 * 3. 割合: 「99%」「9割」「半分」
 * 4. 個数・人数・選: 「200人」「3つ」「5選」「3名」「2位」
 * 5. その他の修飾語付き数字: 「3秒」「5回」「10年」
 */

export interface ExtractedNumbers {
  amounts: string[]; // 金額
  durations: string[]; // 期間
  percentages: string[]; // 割合
  counts: string[]; // 個数・人数・順位
  all: string[]; // 全カテゴリ統合（重複除外、出現順）
}

const EMPTY: ExtractedNumbers = {
  amounts: [],
  durations: [],
  percentages: [],
  counts: [],
  all: [],
};

/**
 * 原稿テキストから数字表現を抽出する。
 * 戻り値の all は全カテゴリの統合リスト（重複除外）。
 */
export function extractNumbersFromScript(script: string): ExtractedNumbers {
  if (!script || typeof script !== 'string') return EMPTY;

  const amounts: string[] = [];
  const durations: string[] = [];
  const percentages: string[] = [];
  const counts: string[] = [];

  const seen = new Set<string>();
  const all: string[] = [];

  function addUnique(arr: string[], val: string) {
    const t = val.trim();
    if (t.length === 0) return;
    if (seen.has(t)) return;
    seen.add(t);
    arr.push(t);
    all.push(t);
  }

  // === 1. 金額 ===
  // パターン例:
  //   「月100万円」「3万円」「524,758円」「¥305,778」「100ドル」「2万」「月3万」
  const patterns: Array<{ regex: RegExp; bucket: string[] }> = [
    // 「¥」または「￥」または「$」がついた金額（カンマあり/なし）
    {
      regex: /[¥￥$][\d,]+(?:\.\d+)?(?:億|万|千)?/g,
      bucket: amounts,
    },
    // 「○○円」（カンマあり数字も含む。前に万・億・千がついていてもOK）
    {
      regex: /[\d,]+(?:\.\d+)?(?:億|万|千)?円/g,
      bucket: amounts,
    },
    // 「○○ドル」「○○ユーロ」「○○元」「○○ウォン」
    {
      regex: /[\d,]+(?:\.\d+)?(?:億|万|千)?(?:ドル|ユーロ|元|ウォン)/g,
      bucket: amounts,
    },
    // 「月3万」「年100万」など、円なしの省略形（万・億・千で終わる）
    {
      regex: /(?:月|年|週|日|時間)[\d,]+(?:\.\d+)?(?:億|万|千)/g,
      bucket: amounts,
    },
    // 「月収50万」「年収300万」など省略形
    {
      regex: /(?:月収|年収|日給|時給|月商|年商)[\d,]+(?:\.\d+)?(?:億|万|千)?/g,
      bucket: amounts,
    },
    // 「500万」「3億」「1000千」のように単独で「億・万・千」で終わる省略金額
    // 例:「利益500万出たぞ」「年商3億」
    // 注: 4桁の数字 + 「年」（例:「2026年」）と区別するため、ここでは「億・万・千」のみ対象
    {
      regex: /[\d,]+(?:\.\d+)?(?:億|万|千)(?!円)/g,
      bucket: amounts,
    },

    // === 2. 期間 ===
    {
      regex: /[\d]+(?:\.\d+)?\s*(?:年間|ヶ月|か月|カ月|ヵ月|月間|週間|日間|時間|分間|秒間|年|月|週|日|時|分|秒)/g,
      bucket: durations,
    },

    // === 3. 割合 ===
    {
      regex: /[\d]+(?:\.\d+)?\s*[%％]/g,
      bucket: percentages,
    },
    {
      regex: /[\d]+\s*(?:割|分の[\d]+|パーセント|ポイント)/g,
      bucket: percentages,
    },

    // === 4. 個数・人数・順位 ===
    {
      regex: /[\d]+\s*(?:人|名|つ|個|本|匹|頭|羽|台|件|枚|品|選|位|歳|才|回|度|社|店|軒|室|部屋|冊|曲|章|問|問題|ステップ|step|STEP)/g,
      bucket: counts,
    },
    // 「STEP4」「STEP①」「Step 1」など、順序逆転パターン
    {
      regex: /(?:STEP|Step|step|ステップ)\s*[\d]+/g,
      bucket: counts,
    },
  ];

  for (const { regex, bucket } of patterns) {
    const matches = script.match(regex) || [];
    for (const m of matches) {
      addUnique(bucket, m);
    }
  }

  return { amounts, durations, percentages, counts, all };
}

/**
 * 抽出した数字をAI向けの「使用可能リスト」文字列に整形する。
 * prompts.ts でプロンプトに埋め込むための関数。
 */
export function formatNumbersForPrompt(extracted: ExtractedNumbers): string {
  const parts: string[] = [];

  if (extracted.amounts.length > 0) {
    parts.push(`金額: ${extracted.amounts.map((s) => `「${s}」`).join('、')}`);
  }
  if (extracted.durations.length > 0) {
    parts.push(`期間: ${extracted.durations.map((s) => `「${s}」`).join('、')}`);
  }
  if (extracted.percentages.length > 0) {
    parts.push(`割合: ${extracted.percentages.map((s) => `「${s}」`).join('、')}`);
  }
  if (extracted.counts.length > 0) {
    parts.push(`個数・人数・順位: ${extracted.counts.map((s) => `「${s}」`).join('、')}`);
  }

  if (parts.length === 0) {
    return '（原稿から具体的な数字が抽出できませんでした。サムネに数字を使用しないでください）';
  }

  return parts.join('\n');
}

/**
 * 生成されたテキスト/プロンプト内に、ホワイトリスト外の数字が混入していないか検証する。
 * 検証で違反が検出された場合、警告ログ用に違反トークンを返す。
 *
 * 注意: 1〜2桁の単独数字（1, 2, 10など）は自然な日本語に頻出するため検証対象外。
 * 「○○円」「○○万」「○○%」など、明らかにサムネ要素として描画される形式のみチェック。
 */
export function detectForeignNumbers(
  text: string,
  whitelist: ExtractedNumbers
): string[] {
  if (!text) return [];

  // 「○○円」「○○万」「○○%」「○○人」「○○年」など、サムネに描画されうる形式
  // ※ 純粋な「12」「5」のような単独数字は検出対象外（自然文で頻出するため）
  const candidateRegexes = [
    // サフィックス（単位）付き
    /[¥￥$]?[\d,]+(?:\.\d+)?(?:億|万|千)?(?:円|ドル|ユーロ|元|ウォン|年間|ヶ月|か月|カ月|月間|週間|日間|時間|分間|秒間|年|月|週|日|時|分|秒|%|％|割|パーセント|ポイント|人|名|つ|個|本|台|件|枚|選|位|歳|才|回|度|社|店|冊|曲|章|問|ステップ)/g,
    // 「○○万」「○○億」「○○千」単独（円なしの省略金額）
    /[\d,]+(?:\.\d+)?(?:億|万|千)(?!円)/g,
    // 「¥305,778」「$1,000」のような先頭通貨記号付き数字（円・ドル等のサフィックスなし）
    /[¥￥$][\d,]+(?:\.\d+)?/g,
    // 「STEP1」「Step 2」のような順序逆転パターン
    /(?:STEP|Step|step|ステップ)\s*[\d]+/g,
  ];

  const tokens: string[] = [];
  for (const r of candidateRegexes) {
    const m = text.match(r) || [];
    tokens.push(...m);
  }

  // 正規化（空白を削除）
  const normalize = (s: string) => s.replace(/\s+/g, '');

  // ホワイトリストの正規化版を作成
  const whitelistNorm = whitelist.all.map(normalize);

  const violations: string[] = [];
  const seen = new Set<string>();

  for (const tok of tokens) {
    const norm = normalize(tok);

    // ホワイトリストのいずれかと部分一致すればOK
    // 例: ホワイトリストに「月100万円」があれば、「100万円」や「100万」もOKとする
    let hit = false;
    for (const w of whitelistNorm) {
      if (w === norm || w.includes(norm) || norm.includes(w)) {
        hit = true;
        break;
      }
    }

    if (!hit && !seen.has(norm)) {
      seen.add(norm);
      violations.push(tok);
    }
  }

  return violations;
}
