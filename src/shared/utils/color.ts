export function rgbToLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function rgbToAnsi256(r: number, g: number, b: number): number {
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);
  return 16 + 36 * ri + 6 * gi + bi;
}

export function rgbToAnsi8(r: number, g: number, b: number): number {
  const lum = rgbToLuminance(r, g, b);
  if (lum < 32) return 30;
  if (lum > 224) return 37;
  const ri = r > 128 ? 1 : 0;
  const gi = g > 128 ? 1 : 0;
  const bi = b > 128 ? 1 : 0;
  return 30 + (bi << 2 | gi << 1 | ri);
}

export function contrastingColor(r: number, g: number, b: number): [number, number, number] {
  const lum = rgbToLuminance(r, g, b);
  if (lum > 128) {
    return [
      Math.max(0, Math.round(r * 0.3)),
      Math.max(0, Math.round(g * 0.3)),
      Math.max(0, Math.round(b * 0.3)),
    ];
  }
  return [
    Math.min(255, Math.round(r + (255 - r) * 0.7)),
    Math.min(255, Math.round(g + (255 - g) * 0.7)),
    Math.min(255, Math.round(b + (255 - b) * 0.7)),
  ];
}
