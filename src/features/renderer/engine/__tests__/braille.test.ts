import { renderBraille } from '../braille';

function createTestImage(
  width: number,
  height: number,
  fill: [number, number, number, number],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return data;
}

function createPixelwiseImage(
  width: number,
  height: number,
  pixelFn: (x: number, y: number) => [number, number, number, number],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = pixelFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  return data;
}

const BRAILLE_BASE = 0x2800;
const BRAILLE_FULL = 0x28FF;

describe('renderBraille', () => {
  it('all white pixels (lum >= 128) with invert=false produces all-dots-on braille', () => {
    // Each braille cell covers 2 cols x 4 rows of dots.
    // With cols=1, dotWidth = width / (1*2), we need sufficient pixels.
    // 2-wide, 4-tall image -> 1 braille cell
    const img = createTestImage(2, 4, [255, 255, 255, 255]);
    const result = renderBraille(img, 2, 4, 1, false);

    expect(result.rows).toBe(1);
    expect(result.cols).toBe(1);
    // White pixels have lum >= 128 -> on = true (invert=false) -> all 8 dots lit
    expect(result.grid[0][0].codePointAt(0)).toBe(BRAILLE_FULL);
  });

  it('all black pixels with invert=false produces empty braille (U+2800)', () => {
    const img = createTestImage(2, 4, [0, 0, 0, 255]);
    const result = renderBraille(img, 2, 4, 1, false);

    expect(result.rows).toBe(1);
    expect(result.cols).toBe(1);
    // Black pixels have lum < 128 -> on = false -> no dots lit
    expect(result.grid[0][0].codePointAt(0)).toBe(BRAILLE_BASE);
  });

  it('inversion swaps all-on and all-off', () => {
    const white = createTestImage(2, 4, [255, 255, 255, 255]);
    const black = createTestImage(2, 4, [0, 0, 0, 255]);

    const whiteNormal = renderBraille(white, 2, 4, 1, false);
    const whiteInvert = renderBraille(white, 2, 4, 1, true);
    const blackNormal = renderBraille(black, 2, 4, 1, false);
    const blackInvert = renderBraille(black, 2, 4, 1, true);

    // White normal = all on, white inverted = all off
    expect(whiteNormal.grid[0][0].codePointAt(0)).toBe(BRAILLE_FULL);
    expect(whiteInvert.grid[0][0].codePointAt(0)).toBe(BRAILLE_BASE);

    // Black normal = all off, black inverted = all on
    expect(blackNormal.grid[0][0].codePointAt(0)).toBe(BRAILLE_BASE);
    expect(blackInvert.grid[0][0].codePointAt(0)).toBe(BRAILLE_FULL);
  });

  it('only top-left dot lit produces correct braille char', () => {
    // Braille dot bit mapping: (0,0)->bit 0
    // Only the top-left pixel should be bright, rest dark.
    // We need a 2x4 pixel image where only (0,0) is white.
    const img = createPixelwiseImage(2, 4, (x, y) =>
      x === 0 && y === 0 ? [255, 255, 255, 255] : [0, 0, 0, 255],
    );
    const result = renderBraille(img, 2, 4, 1, false);

    // Only bit 0 set -> U+2801
    expect(result.grid[0][0].codePointAt(0)).toBe(BRAILLE_BASE + 1);
  });

  it('only top-right dot lit produces correct braille char', () => {
    // Braille dot bit mapping: (0,1)->bit 3
    const img = createPixelwiseImage(2, 4, (x, y) =>
      x === 1 && y === 0 ? [255, 255, 255, 255] : [0, 0, 0, 255],
    );
    const result = renderBraille(img, 2, 4, 1, false);

    // Only bit 3 set -> U+2808
    expect(result.grid[0][0].codePointAt(0)).toBe(BRAILLE_BASE + (1 << 3));
  });

  it('bottom-right dot produces correct braille char', () => {
    // Braille dot bit mapping: (3,1)->bit 7
    const img = createPixelwiseImage(2, 4, (x, y) =>
      x === 1 && y === 3 ? [255, 255, 255, 255] : [0, 0, 0, 255],
    );
    const result = renderBraille(img, 2, 4, 1, false);

    // Only bit 7 set -> U+2880
    expect(result.grid[0][0].codePointAt(0)).toBe(BRAILLE_BASE + (1 << 7));
  });

  it('returns correct grid dimensions for larger images', () => {
    // 20-wide, 16-tall image, 5 cols
    // dotWidth = 20 / (5 * 2) = 2
    // dotHeight = 2 (square dots)
    // rows = floor(16 / (2 * 4)) = floor(2) = 2
    const img = createTestImage(20, 16, [128, 128, 128, 255]);
    const result = renderBraille(img, 20, 16, 5, false);

    expect(result.cols).toBe(5);
    expect(result.rows).toBe(2);
    expect(result.grid.length).toBe(2);
    expect(result.grid[0].length).toBe(5);
  });

  it('all braille characters are in the valid Unicode range', () => {
    const img = createPixelwiseImage(10, 8, (x, y) => {
      const lum = ((x + y) * 30) % 256;
      return [lum, lum, lum, 255];
    });
    const result = renderBraille(img, 10, 8, 5, false);

    for (const row of result.grid) {
      for (const cell of row) {
        const cp = cell.codePointAt(0)!;
        expect(cp).toBeGreaterThanOrEqual(BRAILLE_BASE);
        expect(cp).toBeLessThanOrEqual(BRAILLE_FULL);
      }
    }
  });

  it('left column only produces correct bit pattern', () => {
    // Light the entire left column (x=0) only: bits 0,1,2,6
    const img = createPixelwiseImage(2, 4, (x) =>
      x === 0 ? [255, 255, 255, 255] : [0, 0, 0, 255],
    );
    const result = renderBraille(img, 2, 4, 1, false);

    // bits: 0,1,2,6 -> 1 + 2 + 4 + 64 = 71
    const expected = BRAILLE_BASE + (1 << 0) + (1 << 1) + (1 << 2) + (1 << 6);
    expect(result.grid[0][0].codePointAt(0)).toBe(expected);
  });
});
