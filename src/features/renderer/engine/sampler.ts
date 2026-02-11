export interface SampleResult {
  samples: { r: number; g: number; b: number; a: number }[][];
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
}

const MAX_SUBSAMPLE = 4;

/**
 * Samples an image into a grid of averaged color cells.
 *
 * Grid dimensions follow §11.1:
 *   cellWidth  = sourceWidth / cols
 *   cellHeight = cellWidth / aspectRatioCorrection
 *   rows       = floor(sourceHeight / cellHeight)
 *
 * For cells larger than 4x4 pixels, subsamples at most 4x4 evenly-spaced
 * points instead of averaging every pixel (box filter optimization).
 */
export function sampleGrid(
  imageData: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  cols: number,
  aspectRatioCorrection: number,
): SampleResult {
  const cellWidth = sourceWidth / cols;
  const cellHeight = cellWidth / aspectRatioCorrection;
  const rows = Math.floor(sourceHeight / cellHeight);

  const samples: { r: number; g: number; b: number; a: number }[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowSamples: { r: number; g: number; b: number; a: number }[] = [];

    for (let col = 0; col < cols; col++) {
      const x0 = Math.floor(col * cellWidth);
      const y0 = Math.floor(row * cellHeight);
      const x1 = Math.min(Math.floor((col + 1) * cellWidth), sourceWidth);
      const y1 = Math.min(Math.floor((row + 1) * cellHeight), sourceHeight);

      const regionW = x1 - x0;
      const regionH = y1 - y0;

      if (regionW <= 0 || regionH <= 0) {
        rowSamples.push({ r: 0, g: 0, b: 0, a: 0 });
        continue;
      }

      const cellArea = regionW * regionH;
      const useSubsample = cellArea > MAX_SUBSAMPLE * MAX_SUBSAMPLE;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      if (useSubsample) {
        // Subsample at most 4x4 evenly-spaced points
        const stepsX = Math.min(MAX_SUBSAMPLE, regionW);
        const stepsY = Math.min(MAX_SUBSAMPLE, regionH);
        const stepSizeX = regionW / stepsX;
        const stepSizeY = regionH / stepsY;

        for (let sy = 0; sy < stepsY; sy++) {
          const py = Math.min(y0 + Math.floor(sy * stepSizeY + stepSizeY * 0.5), sourceHeight - 1);
          for (let sx = 0; sx < stepsX; sx++) {
            const px = Math.min(x0 + Math.floor(sx * stepSizeX + stepSizeX * 0.5), sourceWidth - 1);
            const idx = (py * sourceWidth + px) * 4;
            rSum += imageData[idx];
            gSum += imageData[idx + 1];
            bSum += imageData[idx + 2];
            aSum += imageData[idx + 3];
            count++;
          }
        }
      } else {
        // Full box filter for small cells
        for (let py = y0; py < y1; py++) {
          for (let px = x0; px < x1; px++) {
            const idx = (py * sourceWidth + px) * 4;
            rSum += imageData[idx];
            gSum += imageData[idx + 1];
            bSum += imageData[idx + 2];
            aSum += imageData[idx + 3];
            count++;
          }
        }
      }

      const invCount = 1 / count;
      rowSamples.push({
        r: Math.round(rSum * invCount),
        g: Math.round(gSum * invCount),
        b: Math.round(bSum * invCount),
        a: Math.round(aSum * invCount),
      });
    }

    samples.push(rowSamples);
  }

  return { samples, rows, cols, cellWidth, cellHeight };
}
