import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      char: '#',
      fg: [100, 100, 100] as [number, number, number],
    })),
  );
}

function makeCtx(overrides: Partial<AnimationContext> = {}): AnimationContext {
  return {
    t: 0.5,
    frame: 15,
    rows: 10,
    cols: 5,
    cycleDuration: 2,
    ...overrides,
  };
}

describe('rain effect', () => {
  const effect = EFFECT_REGISTRY.get('rain')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('rain');
  });

  it('returns a new grid (does not mutate input)', () => {
    const grid = makeGrid(10, 5);
    const original = JSON.stringify(grid);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result).not.toBe(grid);
    expect(JSON.stringify(grid)).toBe(original);
  });

  it('preserves grid dimensions', () => {
    const grid = makeGrid(10, 5);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result.length).toBe(10);
    expect(result[0].length).toBe(5);
  });

  it('preserves character values', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ rows: 5, cols: 5 }), effect.defaults);
    for (const row of result) {
      for (const cell of row) {
        expect(cell.char).toBe('#');
      }
    }
  });

  it('produces green-tinted fg colors in active columns', () => {
    const grid = makeGrid(10, 5);
    const result = effect.apply(grid, makeCtx(), { density: 1, speed: 1, trailLength: 8 });
    // With density 1, all columns should have active drops
    // At least some cells should have green-dominant fg
    const allFgs = result.flatMap((row) =>
      row.filter((cell) => cell.fg).map((cell) => cell.fg!),
    );
    const greenDominant = allFgs.filter(
      (fg) => fg[1] > fg[0] && fg[1] > fg[2],
    );
    expect(greenDominant.length).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const grid = makeGrid(10, 5);
    const ctx = makeCtx();
    const r1 = effect.apply(grid, ctx, effect.defaults);
    const r2 = effect.apply(grid, ctx, effect.defaults);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
