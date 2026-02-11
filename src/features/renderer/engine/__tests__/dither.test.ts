import { applyDithering } from '../dither';

describe('applyDithering', () => {
  it('returns an empty array for empty input', () => {
    const result = applyDithering([], 10, 50);
    expect(result).toEqual([]);
  });

  it('uniform mid-range grid produces varied output with full strength', () => {
    // 4x4 grid of 128 luminance. With charsetLength=2 (levels=1), quantized
    // values are either 0 or 255. Error diffusion should create variation.
    const grid = [
      [128, 128, 128, 128],
      [128, 128, 128, 128],
      [128, 128, 128, 128],
      [128, 128, 128, 128],
    ];
    const result = applyDithering(grid, 2, 100);

    // Collect unique quantized values
    const values = new Set(result.flat());
    // With binary quantization + dithering, we should see both 0 and 255
    expect(values.size).toBeGreaterThanOrEqual(2);
  });

  it('quantizes values to charset levels', () => {
    // charsetLength=3 -> levels=2 -> valid quantized values: 0, 127.5, 255
    const grid = [[100, 200]];
    const result = applyDithering(grid, 3, 0);

    // With strength=0, output is pure quantization, no error diffusion
    for (const row of result) {
      for (const val of row) {
        // Should be near one of the quantized levels
        const nearestLevel = Math.round((val / 255) * 2) * (255 / 2);
        expect(Math.abs(val - nearestLevel)).toBeLessThan(1);
      }
    }
  });

  it('strength 0 produces pure quantization without error diffusion', () => {
    const grid = [
      [50, 100, 150, 200],
      [50, 100, 150, 200],
    ];
    const charsetLength = 5; // levels=4, quantized: 0, 63.75, 127.5, 191.25, 255
    const result = applyDithering(grid, charsetLength, 0);

    // Each cell should be independently quantized
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 4; x++) {
        const original = grid[y][x];
        const expected = Math.round((original / 255) * 4) * (255 / 4);
        expect(result[y][x]).toBeCloseTo(expected, 5);
      }
    }
  });

  it('strength 100 produces full error diffusion', () => {
    // With full strength, neighboring cells should be affected by error
    const grid = [
      [128, 128],
      [128, 128],
    ];
    const result = applyDithering(grid, 2, 100);

    // With charsetLength=2, first cell quantizes 128 to either 0 or 255
    // The error is distributed to neighbors, so they won't all be identical
    const firstCell = result[0][0];
    // First cell should be 0 or 255
    expect(firstCell === 0 || firstCell === 255).toBe(true);

    // The second cell in the first row receives 7/16 of the error
    const error = 128 - firstCell;
    const expectedSecond = 128 + error * (7 / 16);
    const quantizedSecond = Math.round((expectedSecond / 255) * 1) * 255;
    expect(result[0][1]).toBeCloseTo(quantizedSecond, 5);
  });

  it('does not mutate the input grid', () => {
    const grid = [
      [100, 200],
      [50, 150],
    ];
    const original = grid.map((r) => [...r]);
    applyDithering(grid, 5, 100);

    expect(grid).toEqual(original);
  });

  it('preserves grid dimensions', () => {
    const grid = [
      [100, 150, 200],
      [50, 100, 250],
    ];
    const result = applyDithering(grid, 10, 50);

    expect(result.length).toBe(2);
    expect(result[0].length).toBe(3);
    expect(result[1].length).toBe(3);
  });

  it('handles single-cell grid', () => {
    const grid = [[128]];
    const result = applyDithering(grid, 10, 100);

    expect(result.length).toBe(1);
    expect(result[0].length).toBe(1);
    // Quantized value should be near a valid level
    const levels = 9;
    const expected = Math.round((128 / 255) * levels) * (255 / levels);
    expect(result[0][0]).toBeCloseTo(expected, 5);
  });

  it('strength is clamped to 0-100 range', () => {
    const grid = [[128, 128]];

    // Strength > 100 should behave like 100
    const over = applyDithering(grid, 2, 200);
    const full = applyDithering([[128, 128]], 2, 100);
    expect(over[0][0]).toBeCloseTo(full[0][0], 5);

    // Strength < 0 should behave like 0
    const under = applyDithering([[128, 128]], 2, -50);
    const zero = applyDithering([[128, 128]], 2, 0);
    expect(under[0][0]).toBeCloseTo(zero[0][0], 5);
  });

  it('pure black and pure white are unchanged', () => {
    const grid = [[0, 255]];
    const result = applyDithering(grid, 10, 100);

    // 0 quantizes to 0, 255 quantizes to 255, no error in either case
    expect(result[0][0]).toBeCloseTo(0, 5);
    expect(result[0][1]).toBeCloseTo(255, 5);
  });
});
