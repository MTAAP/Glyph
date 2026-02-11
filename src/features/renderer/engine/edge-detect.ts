// Sobel kernels
const SOBEL_GX = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

const SOBEL_GY = [
  [-1, -2, -1],
  [ 0,  0,  0],
  [ 1,  2,  1],
];

/**
 * Applies Sobel edge detection to a luminance grid.
 *
 * For each cell, computes gradient magnitude and direction.
 * If magnitude exceeds threshold, selects an edge character based on direction:
 *   ~0° or ~180° (horizontal edge) -> `-`
 *   ~90° or ~270° (vertical edge)  -> `|`
 *   ~45°  -> `/`
 *   ~135° -> `\`
 *   Ambiguous junctions            -> `+`
 *
 * Returns null for non-edge cells.
 */
export function detectEdges(
  luminanceGrid: number[][],
  threshold: number,
): (string | null)[][] {
  const rows = luminanceGrid.length;
  if (rows === 0) return [];
  const cols = luminanceGrid[0].length;

  const result: (string | null)[][] = new Array(rows);

  for (let y = 0; y < rows; y++) {
    const edgeRow = new Array<string | null>(cols);

    for (let x = 0; x < cols; x++) {
      // Skip border pixels -- not enough neighbors for 3x3 kernel
      if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
        edgeRow[x] = null;
        continue;
      }

      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const lum = luminanceGrid[y + ky][x + kx];
          gx += lum * SOBEL_GX[ky + 1][kx + 1];
          gy += lum * SOBEL_GY[ky + 1][kx + 1];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);

      if (magnitude <= threshold) {
        edgeRow[x] = null;
        continue;
      }

      edgeRow[x] = directionToChar(gx, gy);
    }

    result[y] = edgeRow;
  }

  return result;
}

/**
 * Maps gradient direction to an edge character.
 * The angle is quantized into 4 principal directions (0°, 45°, 90°, 135°).
 * When both gx and gy are strong (junction), returns `+`.
 */
function directionToChar(gx: number, gy: number): string {
  const absGx = Math.abs(gx);
  const absGy = Math.abs(gy);

  // Junction: both gradients are strong and roughly equal
  if (absGx > 0 && absGy > 0) {
    const ratio = Math.min(absGx, absGy) / Math.max(absGx, absGy);
    if (ratio > 0.8) return '+';
  }

  // atan2 returns radians: convert to degrees in [0, 360)
  let angle = Math.atan2(gy, gx) * (180 / Math.PI);
  if (angle < 0) angle += 180;

  // Quantize to 4 sectors of 45° each
  // Gradient direction is perpendicular to edge direction.
  // Sobel gradient points in the direction of greatest intensity change.
  // A horizontal gradient (gx dominant) means a vertical edge.
  if (angle < 22.5 || angle >= 157.5) {
    // ~0° or ~180° gradient -> vertical edge
    return '|';
  } else if (angle < 67.5) {
    // ~45° gradient -> diagonal edge
    return '/';
  } else if (angle < 112.5) {
    // ~90° gradient -> horizontal edge
    return '-';
  } else {
    // ~135° gradient -> diagonal edge
    return '\\';
  }
}
