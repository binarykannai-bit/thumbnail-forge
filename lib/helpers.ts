import type { Region } from './types';

export function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      res(result.split(',')[1]);
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function cropTo1280x720(b64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      const targetRatio = 1280 / 720;
      const sourceRatio = img.width / img.height;
      let sx, sy, sw, sh;
      if (sourceRatio > targetRatio) {
        sh = img.height;
        sw = sh * targetRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = sw / targetRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1280, 720);
      const result = canvas.toDataURL('image/png').split(',')[1];
      resolve(result);
    };
    img.onerror = () => reject(new Error('画像のリサイズ失敗'));
    img.src = `data:image/png;base64,${b64}`;
  });
}

export function buildRegionInstruction(regions: Region[]): string {
  if (regions.length === 0) return '';
  const positions = regions.map((r, i) => {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const h = cy < 33 ? '上部' : cy > 66 ? '下部' : '中央';
    const v = cx < 33 ? '左' : cx > 66 ? '右' : '中央';
    let posEN = '';
    if (h === '上部' && v === '左') posEN = 'top-left';
    else if (h === '上部' && v === '右') posEN = 'top-right';
    else if (h === '上部') posEN = 'top-center';
    else if (h === '下部' && v === '左') posEN = 'bottom-left';
    else if (h === '下部' && v === '右') posEN = 'bottom-right';
    else if (h === '下部') posEN = 'bottom-center';
    else if (v === '左') posEN = 'middle-left';
    else if (v === '右') posEN = 'middle-right';
    else posEN = 'center';

    let actionDesc = '';
    if (r.action === 'change_text') actionDesc = `Change the text in this area to "${r.value}"`;
    else if (r.action === 'remove') actionDesc = `Remove the content in this area completely`;
    else if (r.action === 'free') actionDesc = r.value;

    return `${i + 1}. In the ${posEN} area (approximately x=${Math.round(r.x)}%, y=${Math.round(r.y)}%, width=${Math.round(r.w)}%, height=${Math.round(r.h)}%): ${actionDesc}`;
  }).join('\n');

  return `\n\n## REGIONAL EDIT INSTRUCTIONS (apply these specific edits to the indicated areas)\n${positions}\n\nApply these edits while preserving the rest of the thumbnail's composition, style, and quality. Areas not mentioned should remain unchanged.`;
}
