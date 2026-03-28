/**
 * Runtime font measurement for variable typography.
 *
 * Measures character brightness (pixel coverage) and width (canvas.measureText)
 * at runtime for the active charset, replacing static lookup tables.
 *
 * Runs on main thread only — canvas text APIs are unavailable in workers.
 */

import type { MeasuredEntry, MeasuredPalette } from '@/shared/types';

/** Canvas size for brightness measurement — 28x28 provides good resolution. */
const MEASURE_SIZE = 28;

/** Font weights to measure: thin, normal, bold. */
const MEASURE_WEIGHTS = [300, 500, 800] as const;

/** Module-scope cache: key is "font|charset", value is the sorted palette. */
const paletteCache = new Map<string, MeasuredPalette>();

/**
 * Measures a single character's brightness (pixel coverage) by rendering
 * it onto a small offscreen canvas and counting non-transparent pixels.
 *
 * Returns a normalized 0–1 value where 0 = no ink and 1 = fully covered.
 */
export function measureCharBrightness(
  char: string,
  font: string,
  weight: number,
  italic: boolean,
  ctx: CanvasRenderingContext2D,
  size: number = MEASURE_SIZE,
): number {
  ctx.clearRect(0, 0, size, size);

  const style = italic ? 'italic' : 'normal';
  ctx.font = `${style} ${weight} ${size * 0.8}px ${font}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.fillText(char, size / 2, size / 2);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  let covered = 0;
  const totalPixels = size * size;

  // Count pixels with any alpha coverage
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      covered += data[i] / 255;
    }
  }

  return covered / totalPixels;
}

/**
 * Measures a character's width using canvas.measureText, normalized to em.
 */
function measureCharWidth(
  char: string,
  font: string,
  weight: number,
  italic: boolean,
  ctx: CanvasRenderingContext2D,
  fontSize: number,
): number {
  const style = italic ? 'italic' : 'normal';
  ctx.font = `${style} ${weight} ${fontSize}px ${font}`;
  const metrics = ctx.measureText(char);
  return metrics.width / fontSize;
}

/**
 * Builds a MeasuredPalette for the given charset and font combination.
 * Iterates charset x weights x styles, measuring brightness and width.
 *
 * Results are cached per font+charset key. Returns the cached version
 * if available. Pass `invalidate: true` to force remeasurement.
 */
export function measureCharsetPalette(
  charset: string,
  font: string,
  useItalic: boolean,
  invalidate: boolean = false,
): MeasuredPalette {
  const cacheKey = `${font}|${charset}|${useItalic}`;

  if (!invalidate && paletteCache.has(cacheKey)) {
    return paletteCache.get(cacheKey)!;
  }

  const start = performance.now();

  const canvas = document.createElement('canvas');
  canvas.width = MEASURE_SIZE;
  canvas.height = MEASURE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    // Measurement failed — return empty palette (caller falls back to static tables)
    return [];
  }

  const styles: boolean[] = useItalic ? [false, true] : [false];
  const entries: MeasuredEntry[] = [];
  const fontSize = MEASURE_SIZE * 0.8;

  for (let i = 0; i < charset.length; i++) {
    const char = charset[i];

    for (const weight of MEASURE_WEIGHTS) {
      for (const italic of styles) {
        const brightness = measureCharBrightness(char, font, weight, italic, ctx, MEASURE_SIZE);
        const width = measureCharWidth(char, font, weight, italic, ctx, fontSize);

        entries.push({ char, weight, italic, brightness, width });
      }
    }
  }

  // Sort by brightness ascending for binary search
  entries.sort((a, b) => a.brightness - b.brightness);

  const elapsed = performance.now() - start;
  console.log(`Font measurement: ${entries.length} entries in ${Math.round(elapsed)}ms for ${font}`);

  paletteCache.set(cacheKey, entries);
  return entries;
}

/**
 * Clears the palette cache (useful for testing or when fonts change).
 */
export function clearPaletteCache(): void {
  paletteCache.clear();
}
