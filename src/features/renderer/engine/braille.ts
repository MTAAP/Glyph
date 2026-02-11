import { rgbToLuminance } from '@/shared/utils/color';

// Braille Unicode block: U+2800 to U+28FF
// Each character encodes a 2-wide x 4-tall dot grid.
// Bit positions map (row, col) to bits:
//   (0,0)->0  (0,1)->3
//   (1,0)->1  (1,1)->4
//   (2,0)->2  (2,1)->5
//   (3,0)->6  (3,1)->7
const BRAILLE_BASE = 0x2800;

const DOT_BITS: number[][] = [
  [0, 3],  // row 0
  [1, 4],  // row 1
  [2, 5],  // row 2
  [6, 7],  // row 3
];

const DOTS_PER_ROW = 4;
const DOTS_PER_COL = 2;

/**
 * Renders an image as a grid of Unicode braille characters.
 *
 * Each output cell encodes a 2x4 sub-grid of pixels. Pixels are thresholded
 * to binary using their luminance (above/below 128), then packed into a
 * braille codepoint.
 */
export function renderBraille(
  imageData: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  cols: number,
  invertRamp: boolean,
): { grid: string[][]; rows: number; cols: number } {
  // Each braille cell covers DOTS_PER_COL pixels wide, DOTS_PER_ROW pixels tall
  const dotWidth = sourceWidth / (cols * DOTS_PER_COL);
  const dotHeight = dotWidth; // square dots
  const rows = Math.floor(sourceHeight / (dotHeight * DOTS_PER_ROW));

  const grid: string[][] = new Array(rows);

  for (let row = 0; row < rows; row++) {
    const charRow = new Array<string>(cols);

    for (let col = 0; col < cols; col++) {
      let bits = 0;

      for (let dy = 0; dy < DOTS_PER_ROW; dy++) {
        for (let dx = 0; dx < DOTS_PER_COL; dx++) {
          // Center of each dot cell
          const px = Math.floor((col * DOTS_PER_COL + dx + 0.5) * dotWidth);
          const py = Math.floor((row * DOTS_PER_ROW + dy + 0.5) * dotHeight);

          if (px >= sourceWidth || py >= sourceHeight) continue;

          const idx = (py * sourceWidth + px) * 4;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          const lum = rgbToLuminance(r, g, b);

          // Threshold: bright pixels are "on" by default
          let on = lum >= 128;
          if (invertRamp) on = !on;

          if (on) {
            bits |= 1 << DOT_BITS[dy][dx];
          }
        }
      }

      charRow[col] = String.fromCodePoint(BRAILLE_BASE + bits);
    }

    grid[row] = charRow;
  }

  return { grid, rows, cols };
}
