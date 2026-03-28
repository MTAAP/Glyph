/**
 * Variable typographic mapping.
 *
 * Inspired by chenglou/pretext's variable-typographic-ascii technique,
 * this module uses font weight as an additional dimension to encode
 * brightness. Within each character's luminance band, the fractional
 * position is mapped to a CSS font-weight (100–900), giving much finer
 * brightness gradation than character selection alone.
 *
 * With a 10-char charset and 9 weight steps, this yields ~90 effective
 * brightness levels vs the standard 10.
 */

import type { CharacterCell } from '@/shared/types';

/** Standard CSS font-weight values we map to (100-step increments). */
const WEIGHT_MIN = 100;
const WEIGHT_MAX = 900;
const WEIGHT_STEP = 100;

/**
 * Maps a luminance grid to CharacterCells with both char and weight.
 *
 * For each cell, computes:
 *   exactIdx = (luminance / 255) * (charsetLength - 1)
 *   charIdx  = floor(exactIdx)           → which character
 *   fraction = exactIdx - charIdx         → position within band
 *   weight   = 100 + round(fraction * 8) * 100  → font weight 100-900
 *
 * A heavier weight renders more "ink" on screen, so it maps to the
 * brighter end of the character's band.
 */
export function mapLuminanceToVariableType(
  luminanceGrid: number[][],
  charset: string,
  invertRamp: boolean,
): CharacterCell[][] {
  const rows = luminanceGrid.length;
  const charLen = charset.length;
  const maxIndex = charLen - 1;
  const weightSteps = (WEIGHT_MAX - WEIGHT_MIN) / WEIGHT_STEP; // 8
  const grid: CharacterCell[][] = new Array(rows);

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

      // Fraction within this character's band (0 = just entered, 1 = about to leave)
      const fraction = maxIndex > 0 ? exactIdx - charIdx : 0;

      // Map fraction to weight: heavier weight = more visual density
      const weightIdx = Math.round(fraction * weightSteps);
      const weight = WEIGHT_MIN + weightIdx * WEIGHT_STEP;

      cellRow[x] = {
        char: charset[charIdx],
        weight,
      };
    }

    grid[y] = cellRow;
  }

  return grid;
}
