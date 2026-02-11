/**
 * Applies Floyd-Steinberg error-diffusion dithering to a luminance grid.
 *
 * Quantizes each cell's luminance to the nearest discrete level (based on
 * charsetLength), then distributes the quantization error to neighbors:
 *   right:        7/16
 *   bottom-left:  3/16
 *   bottom:       5/16
 *   bottom-right: 1/16
 *
 * strength (0-100) scales how much error is distributed:
 *   0   = no dithering (pure quantization)
 *   100 = full Floyd-Steinberg diffusion
 */
export function applyDithering(
  luminanceGrid: number[][],
  charsetLength: number,
  strength: number,
): number[][] {
  const rows = luminanceGrid.length;
  if (rows === 0) return [];
  const cols = luminanceGrid[0].length;
  const levels = charsetLength - 1;

  // Copy the grid to avoid mutating the input
  const grid: number[][] = new Array(rows);
  for (let y = 0; y < rows; y++) {
    grid[y] = new Array<number>(cols);
    for (let x = 0; x < cols; x++) {
      grid[y][x] = luminanceGrid[y][x];
    }
  }

  const scale = Math.max(0, Math.min(100, strength)) / 100;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const oldVal = grid[y][x];

      // Quantize to nearest discrete level then scale back to 0-255
      const quantized = Math.round((oldVal / 255) * levels) * (255 / levels);
      grid[y][x] = quantized;

      const error = (oldVal - quantized) * scale;

      // Distribute error to neighbors
      if (x + 1 < cols) {
        grid[y][x + 1] += error * (7 / 16);
      }
      if (y + 1 < rows) {
        if (x - 1 >= 0) {
          grid[y + 1][x - 1] += error * (3 / 16);
        }
        grid[y + 1][x] += error * (5 / 16);
        if (x + 1 < cols) {
          grid[y + 1][x + 1] += error * (1 / 16);
        }
      }
    }
  }

  return grid;
}
