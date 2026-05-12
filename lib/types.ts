export interface RefImage {
  id: string;
  name: string;
  base64: string;
  mediaType: string;
  context: string;
  isMain: boolean;
}

export interface VisualAsset {
  id: string;
  name: string;
  base64: string;
  mediaType: string;
}

export interface FormData {
  mainCategory: string;
  subCategory: string;
  audiences: string[];
  psychology: string[];
  persona: string;
  direction: string[];
  mainVisual: string;
  density: string;
  fontSize: string;
  ng: string[];
  refs: RefImage[];
  visualAssets: VisualAsset[];
  script: string;
  requiredPhrases: string[];
  phraseInput: string;
}

export interface Title {
  text: string;
  trigger: string;
  structure?: string;
  expectedCTR: string;
}

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  action: 'change_text' | 'remove' | 'free';
  value: string;
  id: string;
}

export interface Thumbnail {
  label: string;
  linkedTitleIndex?: number;
  thumbnailText: {
    badge?: string;       // 吹き出し（例: "※ガチで早くやれw", "本当は", "スマホだけ"）— オプション
    headline?: string;    // 上段（カテゴリ・テーマ）（例: "AI×動物", "新 楽天ROOM", "スマホで"）— オプション
    mainCopy: string;     // 中央（最大文字・最重要・必須）（例: "自動収益", "コピペで日給1万", "教えたくない"）
    subCopy?: string;     // 下段（メリット・結果）（例: "月60万超えました", "もうずっと儲かる"）— オプション
    marker: string;       // 黄色マーカー強調語（必須）
  };
  imagePrompt: string;
  imageBase64: string | null;
  originalImageBase64?: string | null;
  editedImageBase64?: string | null;
  imageError?: string | null;
}

export interface GenerationResult {
  titles: Title[];
  thumbnails: Thumbnail[];
  isDemo?: boolean;
}
