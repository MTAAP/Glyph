import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      char: String.fromCharCode(65 + (y * cols + x) % 26),
      fg: [100, 100, 100] as [number, number, number],
    })),
  );
}

function makeCtx(overrides: Partial<AnimationContext> = {}): AnimationContext {
  return {
    t: 0.5,
    frame: 15,
    rows: 3,
    cols: 4,
    cycleDuration: 2,
    ...overrides,
  };
}

describe('scroll effect', () => {
  const effect = EFFECT_REGISTRY.get('scroll')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('scroll');
  });

  it('returns a new grid (does not mutate input)', () => {
    const grid = makeGrid(3, 4);
    const original = JSON.stringify(grid);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result).not.toBe(grid);
    expect(JSON.stringify(grid)).toBe(original);
  });

  it('preserves grid dimensions', () => {
    const grid = makeGrid(3, 4);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(4);
  });

  it('preserves all characters (wrapping)', () => {
    const grid = makeGrid(3, 4);
    const inputChars = grid.flat().map((c) => c.char).sort();
    const result = effect.apply(grid, makeCtx(), { direction: 0, speed: 1 });
    const outputChars = result.flat().map((c) => c.char).sort();
    expect(outputChars).toEqual(inputChars);
  });

  it('at speed=0 produces no shift', () => {
    const grid = makeGrid(3, 4);
    const result = effect.apply(grid, makeCtx(), { direction: 0, speed: 0 });
    // With speed=0, offset is 0, so positions should be unchanged
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
        expect(result[y][x].char).toBe(grid[y][x].char);
      }
    }
  });

  it('scrolls left (direction=0)', () => {
    const grid = makeGrid(1, 4);
    // At t=0.5, speed=2: offset = round(0.5*2*4) = round(4) = 4 → full wrap, same as original
    // Use t=0.25, speed=1: offset = round(0.25*1*4) = round(1) = 1
    const result = effect.apply(grid, makeCtx({ t: 0.25, rows: 1, cols: 4 }), { direction: 0, speed: 1 });
    // Left scroll by 1: each cell gets content from x+1
    expect(result[0][0].char).toBe(grid[0][1].char);
    expect(result[0][1].char).toBe(grid[0][2].char);
    expect(result[0][2].char).toBe(grid[0][3].char);
    expect(result[0][3].char).toBe(grid[0][0].char);
  });

  it('handles empty grid', () => {
    const grid: CharacterGrid = [];
    const result = effect.apply(grid, makeCtx({ rows: 0, cols: 0 }), effect.defaults);
    expect(result.length).toBe(0);
  });

  it('is deterministic', () => {
    const grid = makeGrid(3, 4);
    const ctx = makeCtx();
    const r1 = effect.apply(grid, ctx, effect.defaults);
    const r2 = effect.apply(grid, ctx, effect.defaults);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
