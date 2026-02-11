import { detectEdges } from '../edge-detect';

/**
 * Creates a luminance grid from a flat 2D array shorthand.
 */
function makeGrid(rows: number[][]): number[][] {
  return rows;
}

describe('detectEdges', () => {
  it('detects a sharp vertical edge (left=0, right=255)', () => {
    // 5x5 grid: left two columns are 0, right three are 255
    const grid = makeGrid([
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
    ]);
    const result = detectEdges(grid, 50);

    // Border cells are always null
    expect(result[0][2]).toBeNull();
    expect(result[4][2]).toBeNull();

    // Interior cells at the boundary column (x=2) should detect an edge
    // The Sobel gradient at x=2 in interior rows is strong in gx direction
    expect(result[1][2]).not.toBeNull();
    expect(result[2][2]).not.toBeNull();
    expect(result[3][2]).not.toBeNull();

    // Vertical edge -> '|' character (gx dominant means vertical edge)
    expect(result[2][2]).toBe('|');
  });

  it('detects a sharp horizontal edge (top=0, bottom=255)', () => {
    const grid = makeGrid([
      [0,   0,   0,   0,   0],
      [0,   0,   0,   0,   0],
      [255, 255, 255, 255, 255],
      [255, 255, 255, 255, 255],
      [255, 255, 255, 255, 255],
    ]);
    const result = detectEdges(grid, 50);

    // Interior cell at the boundary row should detect horizontal edge
    // gy dominant -> '-' character
    expect(result[2][2]).not.toBeNull();
    expect(result[2][2]).toBe('-');
  });

  it('returns null for uniform grid (no edges)', () => {
    const grid = makeGrid([
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
    ]);
    const result = detectEdges(grid, 50);

    // All cells should be null -- no edges in a uniform grid
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(result[y][x]).toBeNull();
      }
    }
  });

  it('border cells are always null', () => {
    const grid = makeGrid([
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
    ]);
    const result = detectEdges(grid, 0);

    // Top and bottom rows
    for (let x = 0; x < 5; x++) {
      expect(result[0][x]).toBeNull();
      expect(result[4][x]).toBeNull();
    }
    // Left and right columns
    for (let y = 0; y < 5; y++) {
      expect(result[y][0]).toBeNull();
      expect(result[y][4]).toBeNull();
    }
  });

  it('high threshold detects fewer edges', () => {
    // Gentle gradient: left=100, right=200
    const grid = makeGrid([
      [100, 100, 200, 200, 200],
      [100, 100, 200, 200, 200],
      [100, 100, 200, 200, 200],
      [100, 100, 200, 200, 200],
      [100, 100, 200, 200, 200],
    ]);

    const lowThresh = detectEdges(grid, 50);
    const highThresh = detectEdges(grid, 1000);

    // Count non-null edges
    const countEdges = (g: (string | null)[][]) =>
      g.flat().filter((c) => c !== null).length;

    expect(countEdges(lowThresh)).toBeGreaterThan(0);
    expect(countEdges(highThresh)).toBeLessThanOrEqual(countEdges(lowThresh));
  });

  it('threshold 0 detects edges even for small gradients', () => {
    // Subtle gradient across the grid
    const grid = makeGrid([
      [100, 101, 102, 103, 104],
      [100, 101, 102, 103, 104],
      [100, 101, 102, 103, 104],
      [100, 101, 102, 103, 104],
      [100, 101, 102, 103, 104],
    ]);

    const result = detectEdges(grid, 0);

    // Even small gradients should produce edges with threshold=0
    const edgeCount = result.flat().filter((c) => c !== null).length;
    expect(edgeCount).toBeGreaterThan(0);
  });

  it('returns an empty array for empty input', () => {
    const result = detectEdges([], 50);
    expect(result).toEqual([]);
  });

  it('edge characters are valid edge symbols', () => {
    const validEdgeChars = new Set(['|', '-', '/', '\\', '+']);

    const grid = makeGrid([
      [0,   0,   255, 255, 255],
      [0,   0,   255, 255, 255],
      [0,   0,   255, 255, 255],
      [255, 255, 255, 0,   0],
      [255, 255, 255, 0,   0],
    ]);
    const result = detectEdges(grid, 50);

    for (const row of result) {
      for (const cell of row) {
        if (cell !== null) {
          expect(validEdgeChars.has(cell)).toBe(true);
        }
      }
    }
  });

  it('detects diagonal edges', () => {
    // Diagonal pattern: top-left bright, bottom-right dark
    const grid = makeGrid([
      [255, 255, 200, 100, 0],
      [255, 255, 200, 100, 0],
      [200, 200, 128, 50,  0],
      [100, 100, 50,  0,   0],
      [0,   0,   0,   0,   0],
    ]);
    const result = detectEdges(grid, 50);

    // There should be at least some non-null edge cells in the interior
    const interiorEdges = [];
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 4; x++) {
        if (result[y][x] !== null) {
          interiorEdges.push(result[y][x]);
        }
      }
    }
    expect(interiorEdges.length).toBeGreaterThan(0);
  });
});
