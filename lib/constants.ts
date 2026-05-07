import { Zap, Crown, ShieldCheck, Eye, AlertTriangle, Award, Minus, Flame, Layers, Sparkles, Anchor, MessageSquareWarning } from 'lucide-react';

export const STEPS = [
  { id: 1, label: '基本情報' },
  { id: 2, label: '参考サムネ' },
  { id: 3, label: '原稿' },
  { id: 4, label: '必須文言' },
  { id: 5, label: '生成結果' },
];

export const MAIN_CATEGORIES = [
  'エンタメ・バラエティ', 'ゲーム実況', '教育・解説',
  'ビジネス・マネー', '美容・ファッション', '料理・グルメ',
  '旅行・Vlog', '健康・フィットネス', 'テクノロジー・AI',
  '音楽・アーティスト', 'スポーツ', 'アニメ・マンガ・漫画',
  '恋愛・人間関係', 'その他'
];

export const SUB_CATEGORIES = [
  'ビジネス・起業', '副業・フリーランス', '投資・資産形成',
  '金融・経済', 'AI・テクノロジー', 'キャリア・スキルアップ',
  '美容・ライフスタイル', '健康・メンタル', '恋愛・人間関係',
  'エンタメ・雑談', 'その他'
];

export const AUDIENCES = ['初心者', '中級者', '上級者', '会社員', '経営者', '主婦', '学生', '20代', '30代', '40代以上'];

export const DIRECTIONS = [
  { id: '強インパクト', desc: '視覚的衝撃で目を奪う' },
  { id: '高級感', desc: '上質で落ち着いた雰囲気' },
  { id: '信頼感', desc: '権威性と安心感' },
  { id: 'ミステリアス', desc: '続きが気になる引き' },
  { id: '不安訴求', desc: '損失回避を刺激' },
  { id: '権威性', desc: 'プロ感・専門家感' },
  { id: 'シンプル', desc: '余白と要素厳選' },
  { id: 'バズ狙い', desc: 'SNS拡散しやすい' },
  { id: '強フック', desc: '思わず手が止まる衝撃の一撃' },
  { id: '強キラーワード', desc: 'クリック必至のパワー文字' },
];

export const MAIN_VISUALS = [
  { id: '顔出し（運営者・演者）', desc: '演者の顔を中心に', upload: { required: true, max: 4, label: '演者の顔写真', hint: '顔がはっきり写っている写真' } },
  { id: '複数人物（対談・ゲスト）', desc: '対談・インタビュー構図', upload: { required: true, max: 4, label: '各演者の顔写真', hint: '対談する人物それぞれの顔写真' } },
  { id: 'キャラクター・アバター', desc: 'VTuber・AIアバター・イラストキャラ', upload: { required: false, max: 2, label: 'キャラクター画像', hint: 'VTuberキャラ・アバター画像' } },
  { id: '図解・グラフ・データ', desc: '情報・数字を主役に', upload: { required: false, max: 3, label: '図解・グラフ素材', hint: '既存のグラフ・図表のスクショ' } },
  { id: '実物・物体', desc: '商品・道具・対象物', upload: { required: false, max: 3, label: '実物の写真', hint: '商品・道具・物の写真' } },
  { id: '風景・場所', desc: 'ロケーション中心', upload: { required: false, max: 3, label: 'ロケ写真', hint: '場所・風景の写真' } },
  { id: 'シーンキャプチャ', desc: '動画内の印象的シーン抜粋', upload: { required: false, max: 4, label: '動画キャプチャ', hint: '動画内の印象的シーンのスクショ' } },
  { id: 'テキスト主役', desc: '文字だけで構成', upload: null },
  { id: '比較・並列構図', desc: '複数要素の対比', upload: { required: false, max: 2, label: '比較対象の画像', hint: '対比したい2つの要素の画像' } },
];

export function getVisualUpload(visualId: string) {
  const v = MAIN_VISUALS.find(x => x.id === visualId);
  return v ? v.upload : null;
}

export const PSYCHOLOGY = [
  { id: '不安・焦り', desc: '「このままで大丈夫？」を解消したい' },
  { id: '疑問・好奇心', desc: '「なぜ？」「本当？」を知りたい' },
  { id: '損したくない', desc: '失敗・損失を回避したい' },
  { id: '成功したい', desc: '結果・成果を出したい' },
  { id: '学びたい', desc: '体系的に理解したい' },
  { id: '時間がない', desc: '効率的・最短で済ませたい' },
  { id: 'トレンド追いたい', desc: '最新・話題を逃したくない' },
  { id: '変わりたい', desc: '自分や生活を改善したい' },
  { id: '共感したい', desc: '「自分だけじゃない」を確認' },
  { id: '対立を見たい', desc: '議論・暴露・本音を見たい' },
];

export const DENSITIES = ['情報量多め', '標準', 'シンプル'];
export const FONT_SIZES = ['大きく目立たせる', 'バランス型', '小さめ高級感'];
export const NG_LIST = ['怪しい雰囲気NG', '派手すぎNG', '赤多用NG', '安っぽさNG', '文字多すぎNG'];
export const REF_CONTEXTS = ['色味参考', '構図参考', '雰囲気参考', 'CTR高そうだから参考', '全体を参考'];

export const DIRECTION_ICONS: Record<string, any> = {
  '強インパクト': Zap,
  '高級感': Crown,
  '信頼感': ShieldCheck,
  'ミステリアス': Eye,
  '不安訴求': AlertTriangle,
  '権威性': Award,
  'シンプル': Minus,
  'バズ狙い': Flame,
  '強フック': Anchor,
  '強キラーワード': MessageSquareWarning,
};

export function getDirectionIcon(label: string) {
  if (!label) return Sparkles;
  if (label.includes('融合') || label.includes('×')) return Layers;
  for (const [key, icon] of Object.entries(DIRECTION_ICONS)) {
    if (label.includes(key)) return icon;
  }
  return Sparkles;
}

// Edit presets for region-based editing
export const EDIT_PRESETS = [
  { id: 'impact', emoji: '🔴', label: 'もっとインパクト', prompt: 'Make the overall impact much stronger - bolder colors, more dramatic lighting, more shocked/intense facial expressions if there are people, larger and more emphatic text overlays.' },
  { id: 'shock', emoji: '😱', label: '表情を驚き強く', prompt: 'Make any human or character expressions show much more intense shock, surprise, or disbelief. Wide eyes, open mouths, raised eyebrows. Exaggerate the emotion.' },
  { id: 'numbers', emoji: '📈', label: '数字を目立たせ', prompt: 'Make any numbers in the thumbnail much larger, bolder, and more prominent. Use bright contrasting colors and strong outlines to emphasize numerical value.' },
  { id: 'redTone', emoji: '🟥', label: '配色を赤系に', prompt: 'Shift the overall color palette to be dominated by reds, oranges, and yellows. Use red for warnings/urgency and yellow for highlights. Keep contrast strong.' },
  { id: 'navyTone', emoji: '🟦', label: '配色を青系に', prompt: 'Shift the overall color palette to be dominated by deep navy, royal blue, and trustworthy blues. Add gold or white accents for premium/authoritative feel.' },
  { id: 'darkTone', emoji: '⬛', label: '配色を黒系に', prompt: 'Shift the overall color palette to be dominated by black backgrounds with high-contrast accent colors (red, gold, or white text). Make it feel dark, mysterious, and authoritative.' },
  { id: 'biggerText', emoji: '🔠', label: '文字を大きく', prompt: 'Make the main text in the thumbnail significantly larger and bolder, occupying more of the visible area. Strengthen text outlines and shadows for maximum readability.' },
  { id: 'simpler', emoji: '🧹', label: 'シンプルに', prompt: 'Reduce visual clutter. Remove unnecessary decorative elements, secondary text, and background details. Focus on one clear subject and one clear message.' },
  { id: 'stronger', emoji: '💪', label: 'もっと強く訴求', prompt: 'Make the persuasive impact much stronger. Sharpen the emotional appeal, intensify warning/urgency cues, make the value proposition impossible to ignore at a glance.' },
];

// Color palette
export const C = {
  bg: '#F4F4F4',
  surface: '#FFFFFF',
  surface2: '#F2F2F2',
  surface3: '#FAFAFA',
  border: '#E5E5E5',
  borderStrong: '#CCCCCC',
  dark: '#0F0F0F',
  darkSurface: '#272727',
  darkBorder: '#303030',
  text: '#0F0F0F',
  textDim: '#606060',
  textMute: '#909090',
  textOnDark: '#FFFFFF',
  red: '#FF0000',
  redBright: '#FF1A1A',
  redHover: '#CC0000',
  redLight: '#FFEBEE',
  redTint: 'rgba(255, 0, 0, 0.06)',
  redTintStrong: 'rgba(255, 0, 0, 0.12)',
  redGlow: 'rgba(255, 0, 0, 0.3)',
  yellow: '#FFD600',
  green: '#10B981',
  warning: '#FF9900',
};

export const FONT = '"Roboto", -apple-system, "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
export const FONT_MONO = '"Roboto Mono", monospace';
export const FONT_COND = '"Roboto Condensed", "Roboto", sans-serif';
export const SHADOW_SM = '0 1px 2px rgba(0,0,0,0.06)';
export const SHADOW_MD = '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)';
