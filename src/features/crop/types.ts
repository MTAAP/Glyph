/** Normalized crop rectangle — all values are 0-1 fractions of source dimensions */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

export type HandlePosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export const DEFAULT_CROP: CropRect = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };

/** Aspect ratio as width/height, or null for free */
export function aspectRatioValue(preset: AspectRatioPreset): number | null {
  switch (preset) {
    case '1:1': return 1;
    case '4:3': return 4 / 3;
    case '16:9': return 16 / 9;
    case '3:2': return 3 / 2;
    default: return null;
  }
}

/** Adjust a crop rect to match the given aspect ratio, keeping the center */
export function enforceAspectOnRect(rect: CropRect, preset: AspectRatioPreset): CropRect {
  const r = aspectRatioValue(preset);
  if (!r) return rect;

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  let w = rect.width;
  let h = w / r;

  // Shrink to fit within 0-1 bounds
  if (h > 1) { h = 1; w = h * r; }
  if (w > 1) { w = 1; h = w / r; }

  let x = cx - w / 2;
  let y = cy - h / 2;
  x = Math.max(0, Math.min(x, 1 - w));
  y = Math.max(0, Math.min(y, 1 - h));

  return { x, y, width: w, height: h };
}
