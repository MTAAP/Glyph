import { applyAdjustments } from '../adjustments';
import type { SampleResult } from '../sampler';

function makeSamples(pixels: { r: number; g: number; b: number; a: number }[][]): SampleResult {
  return {
    samples: pixels,
    rows: pixels.length,
    cols: pixels[0]?.length ?? 0,
    cellWidth: 1,
    cellHeight: 1,
  };
}

describe('applyAdjustments', () => {
  it('returns input unchanged when brightness and contrast are both 0', () => {
    const input = makeSamples([[{ r: 100, g: 150, b: 200, a: 255 }]]);
    const result = applyAdjustments(input, 0, 0);
    expect(result).toBe(input);
  });

  it('increases brightness', () => {
    const input = makeSamples([[{ r: 100, g: 100, b: 100, a: 255 }]]);
    const result = applyAdjustments(input, 50, 0);
    const pixel = result.samples[0][0];
    expect(pixel.r).toBeGreaterThan(100);
    expect(pixel.g).toBeGreaterThan(100);
    expect(pixel.b).toBeGreaterThan(100);
  });

  it('decreases brightness', () => {
    const input = makeSamples([[{ r: 200, g: 200, b: 200, a: 255 }]]);
    const result = applyAdjustments(input, -50, 0);
    const pixel = result.samples[0][0];
    expect(pixel.r).toBeLessThan(200);
    expect(pixel.g).toBeLessThan(200);
    expect(pixel.b).toBeLessThan(200);
  });

  it('increases contrast (pushes values away from 128)', () => {
    const input = makeSamples([
      [
        { r: 200, g: 200, b: 200, a: 255 },
        { r: 50, g: 50, b: 50, a: 255 },
      ],
    ]);
    const result = applyAdjustments(input, 0, 50);
    // Bright pixel should get brighter
    expect(result.samples[0][0].r).toBeGreaterThan(200);
    // Dark pixel should get darker
    expect(result.samples[0][1].r).toBeLessThan(50);
  });

  it('decreases contrast (pushes values toward 128)', () => {
    const input = makeSamples([
      [
        { r: 255, g: 255, b: 255, a: 255 },
        { r: 0, g: 0, b: 0, a: 255 },
      ],
    ]);
    const result = applyAdjustments(input, 0, -50);
    // White pixel moves toward 128
    expect(result.samples[0][0].r).toBeLessThan(255);
    expect(result.samples[0][0].r).toBeGreaterThan(128);
    // Black pixel moves toward 128
    expect(result.samples[0][1].r).toBeGreaterThan(0);
    expect(result.samples[0][1].r).toBeLessThan(128);
  });

  it('clamps values to 0-255', () => {
    const input = makeSamples([[{ r: 250, g: 5, b: 128, a: 255 }]]);
    // Max brightness + max contrast
    const result = applyAdjustments(input, 100, 100);
    const pixel = result.samples[0][0];
    expect(pixel.r).toBeLessThanOrEqual(255);
    expect(pixel.g).toBeGreaterThanOrEqual(0);
    expect(pixel.b).toBeGreaterThanOrEqual(0);
    expect(pixel.b).toBeLessThanOrEqual(255);
  });

  it('clamps with negative extremes', () => {
    const input = makeSamples([[{ r: 10, g: 245, b: 128, a: 255 }]]);
    const result = applyAdjustments(input, -100, 100);
    const pixel = result.samples[0][0];
    expect(pixel.r).toBeGreaterThanOrEqual(0);
    expect(pixel.g).toBeLessThanOrEqual(255);
  });

  it('preserves alpha channel', () => {
    const input = makeSamples([[{ r: 100, g: 100, b: 100, a: 127 }]]);
    const result = applyAdjustments(input, 50, 50);
    expect(result.samples[0][0].a).toBe(127);
  });

  it('preserves sample grid dimensions', () => {
    const input = makeSamples([
      [
        { r: 100, g: 100, b: 100, a: 255 },
        { r: 200, g: 200, b: 200, a: 255 },
      ],
      [
        { r: 50, g: 50, b: 50, a: 255 },
        { r: 150, g: 150, b: 150, a: 255 },
      ],
    ]);
    const result = applyAdjustments(input, 25, -25);
    expect(result.rows).toBe(2);
    expect(result.cols).toBe(2);
    expect(result.samples.length).toBe(2);
    expect(result.samples[0].length).toBe(2);
    expect(result.cellWidth).toBe(1);
    expect(result.cellHeight).toBe(1);
  });

  it('mid-gray (128) is unchanged by contrast alone', () => {
    const input = makeSamples([[{ r: 128, g: 128, b: 128, a: 255 }]]);
    const result = applyAdjustments(input, 0, 100);
    const pixel = result.samples[0][0];
    expect(pixel.r).toBe(128);
    expect(pixel.g).toBe(128);
    expect(pixel.b).toBe(128);
  });

  it('max contrast maps to binary (0 or 255)', () => {
    const input = makeSamples([
      [
        { r: 200, g: 200, b: 200, a: 255 },
        { r: 50, g: 50, b: 50, a: 255 },
      ],
    ]);
    const result = applyAdjustments(input, 0, 100);
    // contrastFactor = 2.0: 128 + (200 - 128) * 2 = 272, clamped to 255
    expect(result.samples[0][0].r).toBe(255);
    // 128 + (50 - 128) * 2 = -28, clamped to 0
    expect(result.samples[0][1].r).toBe(0);
  });
});
