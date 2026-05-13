import { getVisualUpload } from './constants';
import { formatNumbersForPrompt, type ExtractedNumbers } from './script-numbers';

/**
 * サムネ生成プロンプト（DOCXベース・2026年版・完全新規）
 *
 * 設計思想:
 * - ユーザーから提供された7つのノウハウドキュメント（DOCX）の核心だけを抽出
 * - 過去の継ぎ足し（「焼け石に水NG」「揺さぶりNG」「文法3鉄則」など）は全て削除
 * - DOCXの内容を「あるべき姿」として教える（禁止リストではなく目指す方向）
 * - 1270行 → 約450行に圧縮（約65%削減）
 *
 * 元ノウハウドキュメント:
 * 1. _2026年最新版_YouTube再生数が伸びるサムネイル対策.docx
 * 2. _2026年最新_YouTubeサムネイルで再生回数を伸ばす作り方完全ガイド.docx
 * 3. 動画冒頭フック_キラーワード完全マニュアル_完全版.docx
 * 4. ベネフィット訴求ノウハウ_2026年対応版_.docx
 * 5. YouTube分析_運用ノウハウ完全ガイド_2026年対応版_.docx（第1章のみ）
 */

interface PromptData {
  script: string;
  mainCategory: string;
  subCategory?: string;
  audiences: string[];
  psychology: string[];
  direction: string[];
  mainVisual: string;
  persona?: string;
  requiredPhrases?: string[];
  ng?: string[];
  noPersonInImage?: boolean;
  refs: any[];
  visualAssets: any[];
  trainingImageCount?: number;
}

export function buildPrompt(data: PromptData): string {
  const upload = getVisualUpload(data.mainVisual);
  const trainingCount = data.trainingImageCount || 0;
  const refCount = data.refs?.length || 0;
  const assetCount = data.visualAssets?.length || 0;
  const directions = data.direction || [];
  const extracted = (data as any)._extractedNumbers as ExtractedNumbers | undefined;

  // 方向性の振り分け
  const directionInstruction = buildDirectionInstruction(directions);

  // 画像説明文の構築
  const imageInstructions = buildImageInstructions(data, trainingCount, refCount, assetCount, upload);

  // 数字ホワイトリスト
  const numbersSection = buildNumbersSection(extracted);

  // ペルソナ
  const personaSection = data.persona?.trim()
    ? `\n## ペルソナ詳細\n${data.persona.trim()}\n\nこのペルソナの心に刺さるコピー・配色・人物表情・構図を最優先で設計してください。`
    : '';

  // 必須文言
  const requiredSection = data.requiredPhrases && data.requiredPhrases.length > 0
    ? `\n## 必須含有文言（サムネ内に必ず含める）\n${data.requiredPhrases.map((p) => `- 「${p}」`).join('\n')}`
    : '';

  return `あなたはYouTubeサムネイル戦略の専門家です。日本のYouTube市場で実際にCTRを取っている2026年最新のノウハウに基づき、3パターンのサムネイル案を生成してください。

${numbersSection}

# 入力情報

## 動画情報
- メインカテゴリ: ${data.mainCategory}${data.subCategory ? `\n- サブカテゴリ: ${data.subCategory}` : ''}
- ターゲット視聴者: ${data.audiences.join(', ')}
- 視聴者心理: ${data.psychology.join(', ')}
- サムネ方向性: ${directions.join(', ')}
- メインビジュアル: ${data.mainVisual}
- NG表現: ${data.ng && data.ng.length > 0 ? data.ng.join(', ') : 'なし'}
${personaSection}
${requiredSection}

${imageInstructions}

## 動画原稿
\`\`\`
${data.script}
\`\`\`

---

# 🎯 サムネ作成の5つの基本原則（2026年版・絶対遵守）

## 原則1: 視聴者の興味を引く（サムネ＝Q、動画＝A の関係性）

「見たときに結果が分からない」が原則です。視聴者に「気になる」「続きを知りたい」と思わせる設計が必須。

**疑問を生む構図の作り方:**
- 答えを完全には見せず、部分的に隠す（ブラックボックス式）
- 意外性のある対比を提示する（「ベテランと初心者、結果はまさかの…」）
- 禁止・タブーを匂わせる（「なぜ近づいてはいけないのか」）
- 変化の前後を示唆する（「3ヶ月後、こうなった」）

## 原則2: 訴求力のあるパワーワードを入れる

ただの情報提示ではなく、視聴者の心に引っかかる「パワーワード」を使うことで、同じ内容でもクリック率が大きく変わります。**以下6カテゴリのいずれかから最低1つは必須**。

| カテゴリ | 例 |
|---|---|
| 希少性 | 「9割が知らない」「限定公開」「誰も教えてくれない」 |
| 損失回避 | 「知らないと損」「やってはいけない」「失敗する人の共通点」 |
| 権威性 | 「プロが教える」「医師が警告」「専門家の本音」 |
| 数字の具体性 | 「3つの法則」「月5万」「最短7日」 |
| 意外性 | 「実は逆効果」「衝撃の真実」「常識が覆る」 |
| 緊急性 | 「今すぐ」「最新」「2026年版」 |

**重要な注意点:**
- AIが動画内容を解析するため、サムネのパワーワードと動画の中身が一致していないと満足度が下がる
- 煽りすぎは「クリックベイト」として評価を下げる要因になる
- チャンネルジャンルに合ったパワーワードを選ぶ

## 原則3: テーマに沿った人の表情・感情を入れる

YouTubeでは文字だけのサムネより、人の感情・表情が見えるほうがCTRが10〜20%高くなる傾向があります。

**表情選びのポイント:**
- 驚き・喜び・怒り・困惑など、動画のテーマに合った表情
- 視聴者と視線を合わせる、あるいは対象物を見つめる構図
- やや誇張した表情のほうがサムネ上では伝わりやすい
- 動画のトーンを表情から読み取れる設計（「衝撃の結末」なら驚き、「簡単に解決」なら安堵）

## 原則4: 文字の視認性に気を配る

YouTubeの視聴の約70%はスマートフォン。小さな画面で**1秒以内に意味が伝わる**設計が必須。

**視認性の4ルール:**
- 大きな文字で見やすくする（**画面内のテキストは3〜4語以内に絞る**）
- 文字の縁取り・色付け・影で目立たせる（白文字＋黒フチが王道）
- 読みづらくならないよう余白を確保する
- フォントや色で伝えたい感情を表現する

**色彩の使い分け:**
| 色 | 印象と用途 |
|---|---|
| 赤 | 緊急・警告・情熱。強い訴求 |
| 黄 | 注目・注意。パワーワードの背景に最適 |
| 白 | 清潔・読みやすさ。文字色の基本 |
| 黒 | 権威・対比。背景やフチ取り |
| 青 | 信頼・知性。教育・ビジネス系 |
| 緑 | 安心・健康。ポジティブな内容 |

**配色ルール: 1サムネ内で使う色は3色以内に絞る**

## 原則5: 5つの構図パターンから選ぶ

**① ブラックボックス式**
- 答えを●●やモザイクで隠す
- HOW TO・謎解き・ランキング系と相性が良い
- 視聴者は気になってクリックする

**② 4分割式**
- 複数のシーン・ポイントを並べて情報量を演出
- Vlog・まとめ・比較系で効果的
- 「全部見れば分かりそう」期待感を演出

**③ ビフォーアフター式**
- 変化の前後を並べて見せる（矢印・→・vs）
- ダイエット・片付け・投資など変化系コンテンツに最適

**④ 比較式**
- 2つの選択肢・方法・商品を並べる
- 「どっちが良い？」という問いを生む
- レビュー・検証系で効果的

**⑤ 顔アップ＋パワーワード式**
- 表情豊かな顔を大きく配置
- 短いパワーワードを添える
- エンタメ・解説系の王道

---

# 📐 文字配置の5パターン

以下のいずれかのパターンを採用してください：

| パターン | 例（文字内容） | 特徴 |
|---|---|---|
| 驚き型 | 「え、月30万!?」 | 疑問形＋数字＋感情 |
| 問題提起型 | 「副業、失敗してませんか？」 | 視聴者の不安を刺激 |
| 解決提示型 | 「スマホ1台で月収UP」 | シンプルに答えを見せる |
| ステップ型 | 「3ステップで収益化」 | ストーリー性を持たせる |
| 比較型 | 「プロ vs 初心者」 | 対比で関心を引く |

---

# 💬 フック・キラーワード活用（DOCX完全マニュアルより）

サムネのコピーは、視聴者を「立ち止まらせる」フックです。以下の **3条件** を満たすこと:

## フック3条件
1. **驚き・ギャップがある**（普段見慣れているものと違う視点）
2. **視聴者の悩みに直結している**（自分ごとと感じる言葉）
3. **シンプルで短い**（10〜15文字が理想、最大18文字）

## フック5型（いずれかを採用）

**型1: 問いかけ型** — 視聴者に問いを投げて答えを探させる
- 「あなたの動画、ちゃんと届いていますか？」
- 「こんな経験、ありませんか？」

**型2: 共感型（あるある系）** — 「それ私のこと！」と感じさせる
- 「内容は良いはずなのに、最初の数秒で離脱されている」
- 「丁寧に作った動画でも、入口で止まることがあります」

**型3: ベネフィット型** — 視聴後の得を約束
- 「この方法を使えば初心者でも1日で編集スキルが身につく」
- 「3つの手順を変えるだけで、視聴完了率が大幅に改善」

**型4: 比較・ギャップ型** — Before/Afterで変化を見せる
- 「変えたのは最初の3秒だけです」
- 「凝った編集より先に、見直すべき場所があります」

**型5: ストーリー導入型** — 実際の出来事から入る
- 「先日、こんな相談が届きました」
- 「3ヶ月前まで再生数が100回以下だった私が……」

---

# 🎯 ベネフィット訴求ノウハウ（DOCXより）

## 視聴者の心理トリガー集

| トリガー感情 | キーワード例 |
|---|---|
| 損失回避 | 「知らないと損」「99%がやってない」 |
| 驚き・好奇心 | 「実は…」「え？と思ったんですけど」 |
| 限定性 | 「今だけ」「今日しかできない」 |
| 焦り・不安 | 「これ知らないと損します」「あなたは大丈夫？」 |
| 期待値 | 「10分後には解決できます」「成功者の共通点は」 |
| 共有誘発（2026年特有） | 「これ、知らない人が意外と多い」「同じ悩みの人に教えて」 |

## 感情パターン

**質問形式（共感型）:**
- 「あなたは〇〇に悩んでいませんか？」
- 「もしかして、こう思っていませんか？」

**意外性・驚き（ショック型）:**
- 「実は〇〇はまったく効果がない」
- 「ほとんどの人が知らない〇〇の真実」

**損失回避（恐怖型）:**
- 「知らないと大損します」
- 「気づいたときには手遅れ」

**結論の先出し（好奇心刺激型）:**
- 「〇〇するだけで△△になる」
- 「たった1つの工夫で結果が変わる」

---

# 🆕 2026年特有の必須事項

## ① AI整合性（クリックベイト絶対NG）
- 2026年のYouTubeはAIが動画の中身（音声・テロップ・映像）を解析する
- サムネと動画本編の整合性が評価に直結する
- **原稿に書かれていない約束・主張をサムネに入れるのは絶対NG**（満足度アンケートで検出される）
- 誇張は短期的に伸びても、長期的に必ずマイナスになる

## ② 共有設計
- 2026年のアルゴリズムでは「共有ボタン押下数」が拡散の最強トリガー
- 第三者が見たときに内容が一目で分かるサムネ設計にする
- 「○○な人」「△△に悩む方」のようにターゲットを暗示する要素
- 警告・注意喚起系（「これを知らないと危険」）は特に共有されやすい

## ③ CTR目安（業界基準）
| CTR水準 | 評価 |
|---|---|
| 2%未満 | 改善急務 |
| 4〜6% | 業界平均 |
| 8%以上 | 優秀（目標） |

---

# 🌟 参考サムネの最大活用

${refCount > 0 ? `参考サムネ画像が${refCount}枚アップロードされています。これらの画像から以下を読み取り、3つのサムネ案のImage 2.0プロンプトに**忠実に反映**してください:

- 配色・配色バランス（メイン色・アクセント色）
- フォント・文字スタイル（極太ゴシック、縁取り、影など）
- レイアウト・構図（テキストの配置、人物の位置）
- 装飾要素（吹き出し、矢印、囲み、マーカー）

ただし、**完全に同じデザインを再現するのは避け**、参考のエッセンスを取り入れつつ独自性のあるサムネに仕上げてください。` : `参考サムネ画像はアップロードされていません。学習画像とDOCXのノウハウだけで設計してください。`}

${trainingCount > 0 ? `\n学習画像（高CTR成功サムネ）が${trainingCount}枚提示されています。これらの**実際に取れているサムネ**のフォント・色・レイアウト・装飾を3案のいずれかに反映してください。` : ''}

---

${directionInstruction}

---

# 🎯 タスク

以下の制約を満たす3つのサムネ案をJSON形式で生成してください。

## 各サムネに含める要素（5要素構成）

1. **badge** (2〜10文字): 吹き出し型の煽り文句。左上または中央上配置。
   - 例: 「速報」「最新」「衝撃」「警告」「9割が知らない」「※必見」

2. **headline** (2〜14文字): 上段テキスト。テーマ・カテゴリ・対象者を示す。
   - 例: 「2026年版」「NISA投資家へ」「在宅副業」「40代女性向け」

3. **mainCopy** (8〜20文字): 最大文字のメインコピー。**最強パワーワード**で構成。
   - 例: 「99%が知らない投資の真実」「月5万円が30分で稼げる方法」「やってはいけない3つのNG」

4. **subCopy** (8〜24文字): 下段テキスト。メリット・結果・補足。
   - 例: 「初心者でも1ヶ月で月3万円達成」「主婦の私でも在宅で稼げました」

5. **marker** (1〜6文字): 黄色マーカー強調語。badge/headline/mainCopy/subCopyのいずれかに既出の単語。
   - 数字・金額・キーワードが最適。

## 出力JSON形式（JSON以外の説明文・コードブロック記号は不要）

\`\`\`json
{
  "thumbnails": [
    {
      "label": "方向性ラベル（例: 強インパクト型・損失回避訴求）",
      "thumbnailText": {
        "badge": "...",
        "headline": "...",
        "mainCopy": "...",
        "subCopy": "...",
        "marker": "..."
      },
      "imagePrompt": "GPT Image 2用の英語プロンプト（500語以上）"
    }
  ]
}
\`\`\`

## imagePrompt の必須要素

**画像仕様:**
- 1280x720ピクセル（16:9 widescreen aspect ratio）
- 高精細・極太ゴシック・縁取り（8-15px）

**必ず英文プロンプト内で明記:**
1. \`3-4 Japanese text layers covering 60-80% of the image\`（3〜4段のテキスト・画面の60-80%占有）
2. \`Extreme bold gothic font with thick black outline\`（極太ゴシック+太い黒フチ）
3. \`Color usage: red for shocking/warning, white for explanation, yellow for numbers\`
4. \`Speech bubble for badge text\`（badgeは吹き出し型）
5. \`Yellow highlighter background with bold red underline on marker word\`（markerは黄色マーカー+赤下線）
6. \`Natural complete Japanese text only, no garbled or half-finished sentences\`
7. badge/headline/mainCopy/subCopy の **正確な文字を英文プロンプト内でダブルクォートで指定**

## ImagePromptに描画するテキスト指定の例
\`\`\`
Speech bubble at top-left containing "速報" with yellow background and red text.
Top row text "2026年5月" in white bold gothic with thick black outline.
Center main text "政府5兆円使ったのにムダ" in white extreme-bold gothic, occupying maximum visual weight.
Bottom row text "あなたの貯金が目減りする理由" in white/yellow bold gothic.
Within the headline, apply yellow highlighter background with bold red underline ONLY on the "5兆円" portion.
\`\`\`

---

# ✅ 最終チェック（出力前に必ず確認）

1. **原稿一致**: サムネで主張する内容は原稿に書かれているか？（書かれていないことを約束しない）
2. **パワーワード**: 6カテゴリのいずれかが含まれているか？
3. **構図**: 5つの構図パターンのいずれかを採用しているか？
4. **視認性**: 3〜4語以内でスマホで瞬時に読めるか？
5. **方向性一致**: ユーザー指定の方向性（強○○型など）と一致しているか？

これらを満たさない案は書き直してから出力してください。
`;
}

// ============================================================
// ヘルパー関数
// ============================================================

function buildDirectionInstruction(directions: string[]): string {
  if (directions.length === 0) {
    return `# 方向性: 自由設計
原稿の内容に最も合った3つの異なる訴求軸でサムネを設計してください。`;
  }

  // 強○○型が含まれているかチェック
  const strongTypes = directions.filter((d) =>
    ['強インパクト', '強フック', '強キラーワード'].includes(d)
  );

  let strongTypeNote = '';
  if (strongTypes.length > 0) {
    strongTypeNote = `

## 🔥 強○○型 採用時の特別指示

「${strongTypes.join('・')}」が指定されています。**最強のパワーワードでサムネを構成**してください。

**強インパクト型**: 視覚衝撃で目を奪う構図。極太文字・高コントラスト3色・驚愕の表情・赤い矢印・集中線。

**強フック型**: スクロールを物理的に止める一撃。断定形（「全員クビ」「100%失敗」）、否定×逆説（「努力するな」）、タブー領域（「言ってはいけない」）。

**強キラーワード型**: 1単語が画面中央60-70%を占有。「終了」「廃止」「危険」「告発」「禁断」「逆転」「衝撃」「真実」など、単語だけでクリックを決定づける構図。`;
  }

  if (directions.length === 1) {
    return `# 方向性: ${directions[0]}（単独指定）
3パターンすべてこの方向性で、異なる切り口（心理トリガー・構図・コピー戦略）を試してください。
labelは「${directions[0]}型・○○」形式で差別化を明示。${strongTypeNote}`;
  } else if (directions.length === 2) {
    return `# 方向性: 2軸 [${directions.join(', ')}]
以下のように分散:
- Pattern 1: ${directions[0]}型
- Pattern 2: ${directions[1]}型
- Pattern 3: ${directions[0]} × ${directions[1]} 融合型${strongTypeNote}`;
  } else if (directions.length === 3) {
    return `# 方向性: 3軸 [${directions.join(', ')}]
以下のように分散:
- Pattern 1: ${directions[0]}型
- Pattern 2: ${directions[1]}型
- Pattern 3: ${directions[2]}型${strongTypeNote}`;
  } else {
    const top3 = directions.slice(0, 3);
    return `# 方向性: 多軸 [${directions.join(', ')}]
以下を1つずつ採用: ${top3.map((d, i) => `Pattern ${i + 1}: ${d}型`).join(', ')}${strongTypeNote}`;
  }
}

function buildImageInstructions(
  data: PromptData,
  trainingCount: number,
  refCount: number,
  assetCount: number,
  upload: any
): string {
  let result = '\n## 添付画像の解釈\n';
  let imageIndex = 1;

  if (trainingCount > 0) {
    result += `- 最初の${trainingCount}枚 (画像${imageIndex}〜${imageIndex + trainingCount - 1}): 🌟 **高CTR成功サムネ**（学習対象）\n`;
    imageIndex += trainingCount;
  }

  if (refCount > 0) {
    result += `- ${trainingCount > 0 ? '続く' : '最初の'}${refCount}枚 (画像${imageIndex}〜${imageIndex + refCount - 1}): 参考サムネ画像（ユーザー指定）\n`;
    data.refs.forEach((r: any, i: number) => {
      result += `  - 画像${imageIndex + i}${r.isMain ? '(★メイン)' : ''}: ${r.context}\n`;
    });
    imageIndex += refCount;
  }

  if (assetCount > 0 && upload) {
    result += `- 残り${assetCount}枚 (画像${imageIndex}〜${imageIndex + assetCount - 1}): ${upload.label}（メインビジュアル「${data.mainVisual}」用素材）\n`;

    if (data.mainVisual.includes('顔出し') || data.mainVisual.includes('複数人物')) {
      result += `  → 人物の特徴(髪型・表情の傾向・服装・年齢層・体型・雰囲気)を文字で詳細に描写し、Image 2.0が同じイメージの人物を生成できるようにすること。**人物の同一性を保つ**ことが最優先。\n`;
    } else if (data.mainVisual.includes('キャラクター・アバター')) {
      result += `  → キャラクター・アバターのデザイン特徴(髪型・髪色・目の色・服装・小物・表情の傾向・スタイル)を詳細に描写。**キャラの一貫性**を保つ。\n`;
    } else if (data.mainVisual.includes('図解・グラフ')) {
      result += `  → 図解・グラフのスタイル(配色・ライン・タイポグラフィ・データ表現方法)を参考に、サムネに最適化した図解要素を生成プロンプトに組み込む。\n`;
    } else if (data.mainVisual.includes('実物・物体')) {
      result += `  → 物体の特徴(形状・色・質感・ブランド要素)を詳細に描写。\n`;
    } else if (data.mainVisual.includes('風景・場所')) {
      result += `  → ロケーションの特徴(時間帯・天候・光・建物・自然要素)を文字で描写。\n`;
    } else if (data.mainVisual.includes('シーンキャプチャ')) {
      result += `  → シーンの構図・人物配置・アクションを参考に、最も衝撃的な瞬間をサムネとして抽出する構成。\n`;
    } else if (data.mainVisual.includes('比較・並列')) {
      result += `  → 2つの対象を左右（またはbefore/after）で並列配置し、対比が明確に分かるサムネを生成。\n`;
    }
  } else if (upload && !upload.required && assetCount === 0) {
    result += `\n## 素材画像なし\nメインビジュアル「${data.mainVisual}」用の素材画像はアップロードされていません。原稿内容と方向性から最も訴求力のある${data.mainVisual}をAIが文脈から創造します。\n`;
  } else if (upload && !upload.required) {
    result = `\n## 素材画像なし\nメインビジュアル「${data.mainVisual}」用の素材画像はアップロードされていません。AIが文脈から最適な素材を新規生成します。\n`;
  }

  if (data.noPersonInImage) {
    result += `\n## ★人物画像を含めないこと★\nユーザーが「AIによる人物画像を生成しない」を選択しています:\n- **人物・顔・人体・シルエットを一切登場させないこと**\n- 「person」「man」「woman」「face」「figure」「silhouette」「portrait」「human」等の表現を使わない\n- 代わりに: 大きく目立つ文字・タイポグラフィ／図解・グラフ・チャート・アイコン／抽象的な背景・幾何学模様／物体・建物・風景／数字・記号・矢印\n- プロンプト末尾に必ず英語で明示: "IMPORTANT: NO people, faces, humans, figures, or silhouettes anywhere. Pure typography, graphics, objects, or abstract backgrounds only."\n`;
  }

  return result;
}

function buildNumbersSection(extracted?: ExtractedNumbers): string {
  if (!extracted || extracted.all.length === 0) {
    return `
# 🔢 数字の使用制約

**原稿から数字が抽出できませんでした。サムネに具体的な数字（金額・期間・%・人数）を一切使用しないでください。**
- 架空の金額・人数・割合を出してはいけない
- imagePromptの英文内でも、例として数字を書かない
- 数字の代わりに、グラフ・チャート・抽象的視覚要素で「成果感」を演出
- コピーは感情・状態・概念（「自動収益」「教えたくない」「もう不要」など）で訴求
`;
  }

  return `
# 🔢 サムネで使用可能な数字（ホワイトリスト）

**原稿から抽出された下記の数字のみ**を、サムネのテキスト（badge/headline/mainCopy/subCopy/marker）および imagePrompt 内に登場させてください。

## ✅ 使用可能な数字

${formatNumbersForPrompt(extracted)}

## 🚫 絶対NG

- ❌ **リスト外の数字を1つでも使うのは絶対NG**（金額・人数・割合・期間など）
- ❌ imagePromptの英文内で、例として数字を書くのもNG（AIがそれを忠実に描画する）
- ❌ 収益スクショ風画像に表示する数字も、必ず上記リストから選ぶ
- ❌ 「リスト内の数字を組み合わせて新しい数字を作る」のもNG（例: 「100万」「200人」→ 「200万」「100人」を作ってはいけない）
`;
}
