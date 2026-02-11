import { sampleGrid } from '../sampler';

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

describe('sampleGrid', () => {
  it('produces the correct number of rows and cols', () => {
    const img = createTestImage(8, 8, [128, 128, 128, 255]);
    const result = sampleGrid(img, 8, 8, 4, 2.0);

    expect(result.cols).toBe(4);
    // cellWidth = 8/4 = 2, cellHeight = 2/2.0 = 1, rows = floor(8/1) = 8
    expect(result.rows).toBe(8);
    expect(result.samples.length).toBe(8);
    expect(result.samples[0].length).toBe(4);
  });

  it('returns correct average color for uniform fill', () => {
    const img = createTestImage(4, 4, [100, 150, 200, 255]);
    // cols=2, aspectRatio=1 -> cellWidth=2, cellHeight=2, rows=2
    const result = sampleGrid(img, 4, 4, 2, 1.0);

    expect(result.rows).toBe(2);
    expect(result.cols).toBe(2);

    for (const row of result.samples) {
      for (const sample of row) {
        expect(sample.r).toBe(100);
        expect(sample.g).toBe(150);
        expect(sample.b).toBe(200);
        expect(sample.a).toBe(255);
      }
    }
  });

  it('averages distinct pixel values within a cell', () => {
    // 2x2 image: top-left black, top-right white, bottom-left white, bottom-right black
    const data = new Uint8ClampedArray([
      0, 0, 0, 255,     255, 255, 255, 255,
      255, 255, 255, 255, 0, 0, 0, 255,
    ]);
    // Sample the entire 2x2 image into 1 col, aspectRatio=1 -> one cell covers all 4 pixels
    const result = sampleGrid(data, 2, 2, 1, 1.0);

    expect(result.rows).toBe(1);
    expect(result.cols).toBe(1);
    // Average of (0+255+255+0)/4 = 127.5 -> rounds to 128
    expect(result.samples[0][0].r).toBe(128);
    expect(result.samples[0][0].g).toBe(128);
    expect(result.samples[0][0].b).toBe(128);
  });

  it('reports correct cellWidth and cellHeight', () => {
    const img = createTestImage(12, 8, [0, 0, 0, 255]);
    const result = sampleGrid(img, 12, 8, 3, 2.0);

    expect(result.cellWidth).toBe(4);    // 12/3
    expect(result.cellHeight).toBe(2);   // 4/2.0
  });

  it('applies aspect ratio correction to row count', () => {
    const img = createTestImage(8, 8, [128, 128, 128, 255]);

    // aspectRatio=1: cellWidth=2, cellHeight=2, rows=4
    const r1 = sampleGrid(img, 8, 8, 4, 1.0);
    expect(r1.rows).toBe(4);

    // aspectRatio=2: cellWidth=2, cellHeight=1, rows=8
    const r2 = sampleGrid(img, 8, 8, 4, 2.0);
    expect(r2.rows).toBe(8);

    // aspectRatio=0.5: cellWidth=2, cellHeight=4, rows=2
    const r3 = sampleGrid(img, 8, 8, 4, 0.5);
    expect(r3.rows).toBe(2);
  });

  it('handles output cols greater than source width', () => {
    // 2x2 image, request 4 cols -> cellWidth=0.5 per col
    const img = createTestImage(2, 2, [200, 100, 50, 255]);
    const result = sampleGrid(img, 2, 2, 4, 1.0);

    expect(result.cols).toBe(4);
    // With cellWidth=0.5, some cells may have zero width -> fallback to {0,0,0,0}
    // At least the cells that sample valid pixels should match the fill
    for (const row of result.samples) {
      for (const sample of row) {
        // Either valid sample or zero fallback
        if (sample.r > 0) {
          expect(sample.r).toBe(200);
          expect(sample.g).toBe(100);
          expect(sample.b).toBe(50);
        }
      }
    }
  });

  it('correctly samples a gradient image into separate cells', () => {
    // 4x1 image: pixels go [0,0,0,255], [85,85,85,255], [170,170,170,255], [255,255,255,255]
    const data = new Uint8ClampedArray([
      0, 0, 0, 255,
      85, 85, 85, 255,
      170, 170, 170, 255,
      255, 255, 255, 255,
    ]);
    // 4 cols, 1 pixel wide each, aspectRatio=1 -> 1 row, 4 cols
    const result = sampleGrid(data, 4, 1, 4, 1.0);

    expect(result.rows).toBe(1);
    expect(result.cols).toBe(4);
    expect(result.samples[0][0].r).toBe(0);
    expect(result.samples[0][1].r).toBe(85);
    expect(result.samples[0][2].r).toBe(170);
    expect(result.samples[0][3].r).toBe(255);
  });

  it('uses subsampling for large cells', () => {
    // Create a 20x20 image with known pattern: left half red, right half blue
    const img = createPixelwiseImage(20, 20, (x) =>
      x < 10 ? [255, 0, 0, 255] : [0, 0, 255, 255],
    );
    // 2 cols -> cellWidth=10, cellHeight=10 at aspect=1. Each cell is 10x10=100 > 16 -> subsampling
    const result = sampleGrid(img, 20, 20, 2, 1.0);

    expect(result.rows).toBe(2);
    expect(result.cols).toBe(2);
    // Left column should be red
    expect(result.samples[0][0].r).toBe(255);
    expect(result.samples[0][0].b).toBe(0);
    // Right column should be blue
    expect(result.samples[0][1].r).toBe(0);
    expect(result.samples[0][1].b).toBe(255);
  });
});
