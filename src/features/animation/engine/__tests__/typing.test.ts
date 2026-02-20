import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      char: String.fromCharCode(65 + ((y * cols + x) % 26)),
      fg: [100, 150, 200] as [number, number, number],
    })),
  );
}

function makeCtx(overrides: Partial<AnimationContext> = {}): AnimationContext {
  return {
    t: 0.5,
    frame: 10,
    rows: 4,
    cols: 4,
    cycleDuration: 2,
    ...overrides,
  };
}

describe('typing effect', () => {
  const effect = EFFECT_REGISTRY.get('typing')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('typing');
  });

  it('returns a new grid (does not mutate input)', () => {
    const grid = makeGrid(4, 4);
    const original = JSON.stringify(grid);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result).not.toBe(grid);
    expect(JSON.stringify(grid)).toBe(original);
  });

  it('preserves grid dimensions', () => {
    const grid = makeGrid(4, 4);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result.length).toBe(4);
    expect(result[0].length).toBe(4);
  });

  describe('t=0 (empty grid)', () => {
    it('reveals no cells at t=0', () => {
      const grid = makeGrid(3, 3);
      const result = effect.apply(grid, makeCtx({ t: 0, rows: 3, cols: 3 }), { direction: 0, holdFrames: 0 });
      const allChars = result.flatMap((row) => row.map((cell) => cell.char));
      expect(allChars.every((c) => c === ' ')).toBe(true);
    });
  });

  describe('t=1 (full reveal)', () => {
    it('reveals all cells at t=1', () => {
      const grid = makeGrid(3, 3);
      const result = effect.apply(grid, makeCtx({ t: 1, rows: 3, cols: 3 }), { direction: 0, holdFrames: 0 });
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          expect(result[y][x].char).toBe(grid[y][x].char);
        }
      }
    });
  });

  describe('t=0.5 (partial reveal)', () => {
    it('reveals approximately half the cells', () => {
      const grid = makeGrid(4, 4);
      const totalCells = 16;
      const result = effect.apply(grid, makeCtx({ t: 0.5, rows: 4, cols: 4 }), { direction: 0, holdFrames: 0 });
      const revealed = result.flatMap((row) => row.map((cell) => cell.char)).filter((c) => c !== ' ');
      expect(revealed.length).toBeGreaterThan(0);
      expect(revealed.length).toBeLessThanOrEqual(totalCells);
      // At t=0.5 with no hold, should reveal ~8 of 16 cells
      expect(revealed.length).toBe(8);
    });
  });

  describe('direction: LTR (0)', () => {
    it('reveals cells left-to-right, top-to-bottom', () => {
      const grid = makeGrid(2, 3);
      // At t that reveals exactly 3 cells (half of 6)
      const result = effect.apply(grid, makeCtx({ t: 0.5, rows: 2, cols: 3 }), { direction: 0, holdFrames: 0 });
      // First row should be revealed
      expect(result[0][0].char).toBe(grid[0][0].char);
      expect(result[0][1].char).toBe(grid[0][1].char);
      expect(result[0][2].char).toBe(grid[0][2].char);
      // Second row should not be revealed yet
      expect(result[1][0].char).toBe(' ');
      expect(result[1][1].char).toBe(' ');
      expect(result[1][2].char).toBe(' ');
    });
  });

  describe('direction: RTL (1)', () => {
    it('reveals cells right-to-left', () => {
      const grid = makeGrid(2, 3);
      const result = effect.apply(grid, makeCtx({ t: 0.5, rows: 2, cols: 3 }), { direction: 1, holdFrames: 0 });
      // RTL order: (0,2), (0,1), (0,0), (1,2), (1,1), (1,0)
      // At 3/6 revealed: first row all revealed (from right to left)
      expect(result[0][2].char).toBe(grid[0][2].char);
      expect(result[0][1].char).toBe(grid[0][1].char);
      expect(result[0][0].char).toBe(grid[0][0].char);
      expect(result[1][0].char).toBe(' ');
    });
  });

  describe('direction: random (2)', () => {
    it('reveals cells in a seeded-random order', () => {
      const grid = makeGrid(3, 3);
      const result = effect.apply(grid, makeCtx({ t: 0.5, rows: 3, cols: 3 }), { direction: 2, holdFrames: 0 });
      const revealed = result.flatMap((row) => row.map((cell) => cell.char)).filter((c) => c !== ' ');
      // Should reveal approximately half
      expect(revealed.length).toBeGreaterThan(0);
      expect(revealed.length).toBeLessThan(9);
    });

    it('is deterministic (seeded random)', () => {
      const grid = makeGrid(4, 4);
      const ctx = makeCtx({ t: 0.5, rows: 4, cols: 4 });
      const params = { direction: 2, holdFrames: 0 };
      const r1 = effect.apply(grid, ctx, params);
      const r2 = effect.apply(grid, ctx, params);
      expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
    });
  });

  describe('direction: column (3)', () => {
    it('reveals cells column-first (top-down per column)', () => {
      const grid = makeGrid(3, 3);
      // 9 total cells, reveal 3 at t ~= 1/3
      const result = effect.apply(grid, makeCtx({ t: 1 / 3, rows: 3, cols: 3 }), { direction: 3, holdFrames: 0 });
      // Column-first: (0,0), (1,0), (2,0), (0,1), (1,1), (2,1), ...
      // First 3 are the first column
      expect(result[0][0].char).toBe(grid[0][0].char);
      expect(result[1][0].char).toBe(grid[1][0].char);
      expect(result[2][0].char).toBe(grid[2][0].char);
      // Second column not yet revealed
      expect(result[0][1].char).toBe(' ');
    });
  });

  describe('hold frames', () => {
    it('holds the fully revealed state during the hold fraction', () => {
      const grid = makeGrid(2, 2);
      // With holdFrames = 10 and cycleDuration = 2 (assume 30fps -> 60 frames), holdFraction = 10/60
      // revealDuration = 1 - 10/60 ≈ 0.833
      // At t = 0.9 (past revealDuration), all cells should be revealed
      const result = effect.apply(
        grid,
        makeCtx({ t: 0.9, rows: 2, cols: 2, cycleDuration: 2 }),
        { direction: 0, holdFrames: 10 },
      );
      const revealed = result.flatMap((row) => row.map((cell) => cell.char)).filter((c) => c !== ' ');
      expect(revealed.length).toBe(4);
    });
  });

  describe('empty grid', () => {
    it('handles a 0x0 grid', () => {
      const grid: CharacterGrid = [];
      const result = effect.apply(grid, makeCtx({ rows: 0, cols: 0 }), effect.defaults);
      expect(result.length).toBe(0);
    });

    it('handles a grid with empty rows', () => {
      const grid: CharacterGrid = [[], []];
      const result = effect.apply(grid, makeCtx({ rows: 2, cols: 0 }), effect.defaults);
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(0);
    });
  });

  it('preserves fg and bg colors on revealed cells', () => {
    const grid: CharacterGrid = [
      [
        { char: 'X', fg: [255, 0, 0], bg: [0, 0, 255] },
        { char: 'Y', fg: [0, 255, 0] },
      ],
    ];
    const result = effect.apply(grid, makeCtx({ t: 1, rows: 1, cols: 2 }), { direction: 0, holdFrames: 0 });
    expect(result[0][0].fg).toEqual([255, 0, 0]);
    expect(result[0][0].bg).toEqual([0, 0, 255]);
    expect(result[0][1].fg).toEqual([0, 255, 0]);
    expect(result[0][1].bg).toBeUndefined();
  });

  it('preserves fg and bg colors on unrevealed cells', () => {
    const grid: CharacterGrid = [
      [{ char: 'X', fg: [255, 0, 0], bg: [0, 0, 255] }],
    ];
    const result = effect.apply(grid, makeCtx({ t: 0, rows: 1, cols: 1 }), { direction: 0, holdFrames: 0 });
    expect(result[0][0].char).toBe(' ');
    expect(result[0][0].fg).toEqual([255, 0, 0]);
    expect(result[0][0].bg).toEqual([0, 0, 255]);
  });
});
