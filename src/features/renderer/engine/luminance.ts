import { rgbToLuminance } from '@/shared/utils/color';

/**
 * Computes a luminance grid (0-255) from an RGB sample grid.
 * Uses ITU-R BT.601: L = 0.299*R + 0.587*G + 0.114*B
 */
export function computeLuminanceGrid(
  samples: { r: number; g: number; b: number }[][],
): number[][] {
  const rows = samples.length;
  const grid: number[][] = new Array(rows);

  for (let y = 0; y < rows; y++) {
    const row = samples[y];
    const cols = row.length;
    const lumRow = new Array<number>(cols);

    for (let x = 0; x < cols; x++) {
      const { r, g, b } = row[x];
      lumRow[x] = rgbToLuminance(r, g, b);
    }

    grid[y] = lumRow;
  }

  return grid;
}

/**
 * Maps a luminance grid to characters using the given charset.
 * Characters in the charset are assumed to go from darkest (index 0)
 * to brightest (last index). invertRamp reverses this mapping.
 */
export function mapLuminanceToChars(
  luminanceGrid: number[][],
  charset: string,
  invertRamp: boolean,
): string[][] {
  const rows = luminanceGrid.length;
  const charLen = charset.length;
  const maxIndex = charLen - 1;
  const grid: string[][] = new Array(rows);

  for (let y = 0; y < rows; y++) {
    const lumRow = luminanceGrid[y];
    const cols = lumRow.length;
    const charRow = new Array<string>(cols);

    for (let x = 0; x < cols; x++) {
      let idx = Math.floor((lumRow[x] / 255) * maxIndex);
      idx = Math.max(0, Math.min(maxIndex, idx));
      if (invertRamp) {
        idx = maxIndex - idx;
      }
      charRow[x] = charset[idx];
    }

    grid[y] = charRow;
  }

  return grid;
}
