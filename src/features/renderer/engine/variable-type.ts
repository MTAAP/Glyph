/**
 * Variable typographic mapping.
 *
 * Inspired by chenglou/pretext's variable-typographic-ascii technique,
 * this module uses multiple typographic dimensions to encode brightness:
 *
 *   1. Font weight (100–900) — coarse brightness within each character band
 *   2. Font style (normal/italic) — doubles effective levels per weight step
 *   3. Opacity (0.3–1.0) — continuous fine-tuning between discrete steps
 *   4. Proportional mode — width-aware character selection with dual scoring
 *
 * Each dimension can be independently enabled. Together they yield
 * hundreds of effective brightness levels from a small character set.
 */

import type { CharacterCell } from '@/shared/types';

/** Standard CSS font-weight range. */
const WEIGHT_MIN = 100;
const WEIGHT_MAX = 900;
const WEIGHT_STEP = 100;
const WEIGHT_STEPS = (WEIGHT_MAX - WEIGHT_MIN) / WEIGHT_STEP; // 8

/** Opacity range — don't go below 0.3 or characters vanish. */
const OPACITY_MIN = 0.3;
const OPACITY_MAX = 1.0;

export interface VariableTypeOptions {
  italic: boolean;
  opacity: boolean;
  proportional: boolean;
}

/**
 * Maps a luminance grid to CharacterCells with weight, italic, and opacity.
 *
 * The fraction within each character's luminance band is distributed across
 * the enabled dimensions:
 *
 * - Weight only: fraction → 9 weight steps (100–900)
 * - +Italic: fraction's upper half adds italic (18 effective levels per char)
 * - +Opacity: residual sub-step fraction → continuous opacity (0.3–1.0)
 */
export function mapLuminanceToVariableType(
  luminanceGrid: number[][],
  charset: string,
  invertRamp: boolean,
  options: VariableTypeOptions = { italic: false, opacity: false, proportional: false },
): CharacterCell[][] {
  // Proportional mode uses a completely different pipeline
  if (options.proportional) {
    return mapProportionalType(luminanceGrid, charset, invertRamp, options);
  }

  const rows = luminanceGrid.length;
  const charLen = charset.length;
  const maxIndex = charLen - 1;
  const grid: CharacterCell[][] = new Array(rows);

  // Total sub-levels per character band
  const useItalic = options.italic;
  const useOpacity = options.opacity;
  const totalWeightLevels = useItalic ? (WEIGHT_STEPS + 1) * 2 : WEIGHT_STEPS + 1;

  for (let y = 0; y < rows; y++) {
    const lumRow = luminanceGrid[y];
    const cols = lumRow.length;
    const cellRow = new Array<CharacterCell>(cols);

    for (let x = 0; x < cols; x++) {
      let lum = lumRow[x];
      if (invertRamp) lum = 255 - lum;

      const exactIdx = (lum / 255) * maxIndex;
      let charIdx = Math.floor(exactIdx);
      charIdx = Math.max(0, Math.min(maxIndex, charIdx));

      const fraction = maxIndex > 0 ? exactIdx - charIdx : 0;

      // Distribute fraction across enabled dimensions
      const cell: CharacterCell = { char: charset[charIdx] };

      if (useItalic) {
        // Map fraction to combined weight+italic levels
        const level = fraction * (totalWeightLevels - 1);
        const discreteLevel = Math.round(level);
        const stepsPerStyle = WEIGHT_STEPS + 1; // 9

        if (discreteLevel < stepsPerStyle) {
          // Normal style
          cell.weight = WEIGHT_MIN + discreteLevel * WEIGHT_STEP;
          cell.italic = false;
        } else {
          // Italic style
          cell.weight = WEIGHT_MIN + (discreteLevel - stepsPerStyle) * WEIGHT_STEP;
          cell.italic = true;
        }

        if (useOpacity) {
          // Use residual between discrete levels for opacity
          const residual = level - discreteLevel;
          cell.opacity = OPACITY_MIN + (OPACITY_MAX - OPACITY_MIN) * (0.5 + residual * 0.5);
        }
      } else {
        // Weight only (with optional opacity)
        const weightLevel = fraction * WEIGHT_STEPS;
        const discreteWeight = Math.round(weightLevel);
        cell.weight = WEIGHT_MIN + discreteWeight * WEIGHT_STEP;

        if (useOpacity) {
          // Use residual between weight steps for opacity
          const residual = weightLevel - discreteWeight;
          cell.opacity = OPACITY_MIN + (OPACITY_MAX - OPACITY_MIN) * (0.5 + residual * 0.5);
        }
      }

      cellRow[x] = cell;
    }

    grid[y] = cellRow;
  }

  return grid;
}

// ─── Proportional Font Mode ──────────────────────────────────────────────────

/**
 * Pre-computed approximate brightness for printable ASCII characters.
 * Values are normalized 0–1 (0 = lightest/most whitespace, 1 = darkest/most ink).
 * Measured by average pixel coverage at a standard size.
 */
const CHAR_BRIGHTNESS: Record<string, number> = {
  ' ': 0.00, '.': 0.05, '`': 0.06, ',': 0.07, '-': 0.08, "'": 0.06,
  ':': 0.10, ';': 0.12, '!': 0.14, '~': 0.12, '"': 0.10, '^': 0.09,
  '_': 0.08, '=': 0.16, '+': 0.18, '<': 0.16, '>': 0.16, '?': 0.20,
  '/': 0.14, '\\': 0.14, '|': 0.16, '(': 0.16, ')': 0.16, '[': 0.18,
  ']': 0.18, '{': 0.18, '}': 0.18, '1': 0.20, '7': 0.22, 'r': 0.24,
  'c': 0.26, 'v': 0.26, 'i': 0.18, 'l': 0.16, 't': 0.22, 'f': 0.22,
  'j': 0.22, '*': 0.20, 'n': 0.30, 'u': 0.30, 'o': 0.32, 'x': 0.28,
  'z': 0.28, 's': 0.28, 'e': 0.30, 'a': 0.30, '2': 0.28, '3': 0.28,
  '5': 0.30, 'y': 0.26, 'k': 0.30, 'h': 0.30, 'd': 0.32, 'b': 0.32,
  'p': 0.32, 'q': 0.32, '4': 0.28, '6': 0.32, '8': 0.34, '9': 0.32,
  '0': 0.32, 'w': 0.34, 'm': 0.38, 'g': 0.34, 'A': 0.32, 'Y': 0.28,
  'V': 0.28, 'X': 0.30, 'T': 0.26, 'L': 0.24, 'I': 0.18, 'J': 0.22,
  'F': 0.26, 'C': 0.30, 'S': 0.30, 'E': 0.30, 'Z': 0.30, 'K': 0.32,
  'P': 0.30, 'U': 0.32, 'D': 0.34, 'H': 0.34, 'O': 0.34, 'R': 0.32,
  'N': 0.36, 'G': 0.34, 'B': 0.36, 'Q': 0.36, '#': 0.40, '%': 0.38,
  '&': 0.38, 'W': 0.38, 'M': 0.40, '@': 0.46,
};

/**
 * Approximate character widths relative to an em.
 * Proportional fonts vary — these are estimates for a serif like Georgia.
 */
const CHAR_WIDTH: Record<string, number> = {
  ' ': 0.25, '.': 0.25, ',': 0.25, ':': 0.25, ';': 0.25, '!': 0.28,
  "'": 0.20, '"': 0.35, '`': 0.25, '-': 0.35, '~': 0.50, '^': 0.45,
  '_': 0.50, '=': 0.50, '+': 0.50, '<': 0.50, '>': 0.50, '?': 0.45,
  '/': 0.30, '\\': 0.30, '|': 0.25, '(': 0.30, ')': 0.30, '[': 0.30,
  ']': 0.30, '{': 0.35, '}': 0.35, '*': 0.40, '&': 0.70, '#': 0.55,
  '%': 0.70, '@': 0.80,
  '0': 0.55, '1': 0.40, '2': 0.55, '3': 0.55, '4': 0.55, '5': 0.55,
  '6': 0.55, '7': 0.50, '8': 0.55, '9': 0.55,
  'a': 0.50, 'b': 0.55, 'c': 0.45, 'd': 0.55, 'e': 0.45, 'f': 0.30,
  'g': 0.50, 'h': 0.55, 'i': 0.25, 'j': 0.28, 'k': 0.50, 'l': 0.25,
  'm': 0.80, 'n': 0.55, 'o': 0.50, 'p': 0.55, 'q': 0.55, 'r': 0.35,
  's': 0.40, 't': 0.30, 'u': 0.55, 'v': 0.50, 'w': 0.70, 'x': 0.50,
  'y': 0.50, 'z': 0.45,
  'A': 0.65, 'B': 0.65, 'C': 0.60, 'D': 0.70, 'E': 0.60, 'F': 0.55,
  'G': 0.70, 'H': 0.70, 'I': 0.35, 'J': 0.45, 'K': 0.65, 'L': 0.55,
  'M': 0.80, 'N': 0.70, 'O': 0.70, 'P': 0.60, 'Q': 0.70, 'R': 0.65,
  'S': 0.55, 'T': 0.60, 'U': 0.70, 'V': 0.65, 'W': 0.85, 'X': 0.60,
  'Y': 0.60, 'Z': 0.60,
};

/** Weight multiplier: heavier weight = more ink = higher brightness. */
const WEIGHT_BRIGHTNESS_FACTOR: Record<number, number> = {
  100: 0.60, 200: 0.70, 300: 0.80, 400: 1.00,
  500: 1.10, 600: 1.20, 700: 1.35, 800: 1.50, 900: 1.65,
};

interface PaletteEntry {
  char: string;
  weight: number;
  italic: boolean;
  brightness: number;
  width: number;
}

/**
 * Builds a palette of (char, weight, style) entries sorted by brightness,
 * for use in the proportional font dual-scoring selection.
 */
function buildProportionalPalette(
  charset: string,
  useItalic: boolean,
): PaletteEntry[] {
  const weights = [300, 500, 800];
  const styles: boolean[] = useItalic ? [false, true] : [false];
  const entries: PaletteEntry[] = [];

  for (let i = 0; i < charset.length; i++) {
    const ch = charset[i];
    const baseBrightness = CHAR_BRIGHTNESS[ch] ?? 0.25;
    const baseWidth = CHAR_WIDTH[ch] ?? 0.50;

    for (const weight of weights) {
      const wFactor = WEIGHT_BRIGHTNESS_FACTOR[weight] ?? 1.0;
      for (const italic of styles) {
        // Italic is slightly less dense than normal
        const iFactor = italic ? 0.92 : 1.0;
        entries.push({
          char: ch,
          weight,
          italic,
          brightness: Math.min(1.0, baseBrightness * wFactor * iFactor),
          width: baseWidth,
        });
      }
    }
  }

  // Sort by brightness ascending
  entries.sort((a, b) => a.brightness - b.brightness);
  return entries;
}

/**
 * Proportional font mode: selects the best (char, weight, style) for each cell
 * using dual scoring: brightness match + width match.
 *
 * score = brightnessError * 2.5 + widthError / targetWidth
 */
function mapProportionalType(
  luminanceGrid: number[][],
  charset: string,
  invertRamp: boolean,
  options: VariableTypeOptions,
): CharacterCell[][] {
  const rows = luminanceGrid.length;
  const palette = buildProportionalPalette(charset, options.italic);
  const targetWidth = 0.50; // Approximate average cell width in proportional font

  const grid: CharacterCell[][] = new Array(rows);

  for (let y = 0; y < rows; y++) {
    const lumRow = luminanceGrid[y];
    const cols = lumRow.length;
    const cellRow = new Array<CharacterCell>(cols);

    for (let x = 0; x < cols; x++) {
      let lum = lumRow[x];
      if (invertRamp) lum = 255 - lum;

      // Target brightness normalized to 0–1
      const targetBrightness = lum / 255;

      // Find best matching palette entry via dual scoring
      let bestEntry = palette[0];
      let bestScore = Infinity;

      for (const entry of palette) {
        const brightnessError = Math.abs(entry.brightness - targetBrightness);
        const widthError = Math.abs(entry.width - targetWidth);
        const score = brightnessError * 2.5 + widthError / targetWidth;

        if (score < bestScore) {
          bestScore = score;
          bestEntry = entry;
        }
      }

      const cell: CharacterCell = {
        char: bestEntry.char,
        weight: bestEntry.weight,
        italic: bestEntry.italic || undefined,
      };

      if (options.opacity) {
        // Fine-tune with opacity based on remaining brightness error
        const brightnessDiff = targetBrightness - bestEntry.brightness;
        // Positive diff = need more brightness → higher opacity
        cell.opacity = OPACITY_MIN + (OPACITY_MAX - OPACITY_MIN) *
          Math.max(0, Math.min(1, 0.5 + brightnessDiff * 3));
      }

      cellRow[x] = cell;
    }

    grid[y] = cellRow;
  }

  return grid;
}
