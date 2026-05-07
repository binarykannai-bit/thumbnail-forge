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
  thumbnailText: {
    main: string;
    sub: string;
    marker: string;
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
