import { computeLuminanceGrid, mapLuminanceToChars } from '../luminance';

describe('computeLuminanceGrid', () => {
  it('returns luminance ~255 for pure white', () => {
    const samples = [[{ r: 255, g: 255, b: 255 }]];
    const grid = computeLuminanceGrid(samples);
    // BT.601: 0.299*255 + 0.587*255 + 0.114*255 = 255
    expect(grid[0][0]).toBeCloseTo(255, 0);
  });

  it('returns luminance 0 for pure black', () => {
    const samples = [[{ r: 0, g: 0, b: 0 }]];
    const grid = computeLuminanceGrid(samples);
    expect(grid[0][0]).toBe(0);
  });

  it('returns luminance ~76.2 for pure red', () => {
    const samples = [[{ r: 255, g: 0, b: 0 }]];
    const grid = computeLuminanceGrid(samples);
    // 0.299 * 255 = 76.245
    expect(grid[0][0]).toBeCloseTo(76.245, 1);
  });

  it('returns luminance ~149.7 for pure green', () => {
    const samples = [[{ r: 0, g: 255, b: 0 }]];
    const grid = computeLuminanceGrid(samples);
    // 0.587 * 255 = 149.685
    expect(grid[0][0]).toBeCloseTo(149.685, 1);
  });

  it('returns luminance ~29.1 for pure blue', () => {
    const samples = [[{ r: 0, g: 0, b: 255 }]];
    const grid = computeLuminanceGrid(samples);
    // 0.114 * 255 = 29.07
    expect(grid[0][0]).toBeCloseTo(29.07, 1);
  });

  it('preserves grid dimensions', () => {
    const samples = [
      [{ r: 0, g: 0, b: 0 }, { r: 128, g: 128, b: 128 }],
      [{ r: 255, g: 255, b: 255 }, { r: 64, g: 64, b: 64 }],
    ];
    const grid = computeLuminanceGrid(samples);
    expect(grid.length).toBe(2);
    expect(grid[0].length).toBe(2);
    expect(grid[1].length).toBe(2);
  });
});

describe('mapLuminanceToChars', () => {
  const charset = ' .:-=+*#%@';

  it('maps luminance 0 (black) to first char (darkest)', () => {
    const grid = [[0]];
    const result = mapLuminanceToChars(grid, charset, false);
    expect(result[0][0]).toBe(' ');
  });

  it('maps luminance 255 (white) to last char (brightest)', () => {
    const grid = [[255]];
    const result = mapLuminanceToChars(grid, charset, false);
    expect(result[0][0]).toBe('@');
  });

  it('maps mid-range luminance to a middle char', () => {
    // charset has 10 chars, maxIndex=9
    // idx = floor((128/255)*9) = floor(4.518) = 4
    const grid = [[128]];
    const result = mapLuminanceToChars(grid, charset, false);
    expect(result[0][0]).toBe(charset[4]); // '='
  });

  it('inverts mapping when invertRamp is true', () => {
    // Without invert: 0 -> ' ' (index 0)
    // With invert:    0 -> '@' (index 9)
    const grid = [[0]];
    const normal = mapLuminanceToChars(grid, charset, false);
    const inverted = mapLuminanceToChars(grid, charset, true);

    expect(normal[0][0]).toBe(' ');
    expect(inverted[0][0]).toBe('@');
  });

  it('inverts white to first char', () => {
    const grid = [[255]];
    const inverted = mapLuminanceToChars(grid, charset, true);
    expect(inverted[0][0]).toBe(' ');
  });

  it('works with a 2-character charset', () => {
    const shortCharset = '.#';
    // maxIndex=1
    // 0 -> floor(0/255*1) = 0 -> '.'
    // 255 -> floor(255/255*1) = 1 -> '#'
    // 127 -> floor(127/255*1) = floor(0.498) = 0 -> '.'
    // 128 -> floor(128/255*1) = floor(0.502) = 0 -> '.'
    // 200 -> floor(200/255*1) = floor(0.784) = 0 -> '.'
    // 255 -> floor(255/255*1) = 1 -> '#'
    const grid = [[0, 127, 128, 200, 255]];
    const result = mapLuminanceToChars(grid, shortCharset, false);

    expect(result[0][0]).toBe('.');
    expect(result[0][4]).toBe('#');
  });

  it('handles a full row of varying luminance values', () => {
    // Build a row that spans the full range
    const luminances = [0, 28, 57, 85, 113, 142, 170, 198, 227, 255];
    const grid = [luminances];
    const result = mapLuminanceToChars(grid, charset, false);

    // Each luminance should map to the corresponding charset index
    expect(result[0][0]).toBe(' ');
    expect(result[0][9]).toBe('@');
    // Verify monotonic non-decreasing index mapping
    for (let i = 1; i < 10; i++) {
      const prevIdx = charset.indexOf(result[0][i - 1]);
      const currIdx = charset.indexOf(result[0][i]);
      expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
    }
  });

  it('preserves grid dimensions', () => {
    const grid = [
      [0, 128],
      [64, 255],
      [32, 192],
    ];
    const result = mapLuminanceToChars(grid, charset, false);
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(2);
    expect(result[1].length).toBe(2);
    expect(result[2].length).toBe(2);
  });
});
