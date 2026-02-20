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

describe('staticNoise effect', () => {
  const effect = EFFECT_REGISTRY.get('staticNoise')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('staticNoise');
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

  it('with density=0 passes through all cells unchanged', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ rows: 5, cols: 5 }), { density: 0, intensity: 1 });
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(result[y][x].char).toBe('#');
      }
    }
  });

  it('with density=1 replaces most cells with noise characters', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ rows: 5, cols: 5 }), { density: 1, intensity: 1 });
    // Some noise chars may happen to match the original '#', so check that
    // the vast majority are changed rather than expecting all 25
    const noiseCount = result.flat().filter((c) => c.char !== '#').length;
    expect(noiseCount).toBeGreaterThan(20);
  });

  it('noise cells have fg colors', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ rows: 5, cols: 5 }), { density: 1, intensity: 1 });
    for (const row of result) {
      for (const cell of row) {
        expect(cell.fg).toBeDefined();
        expect(cell.fg!.length).toBe(3);
      }
    }
  });

  it('handles empty grid', () => {
    const grid: CharacterGrid = [];
    const result = effect.apply(grid, makeCtx({ rows: 0, cols: 0 }), effect.defaults);
    expect(result.length).toBe(0);
  });

  it('different frames produce different noise', () => {
    const grid = makeGrid(10, 5);
    const r1 = effect.apply(grid, makeCtx({ frame: 1 }), { density: 1, intensity: 1 });
    const r2 = effect.apply(grid, makeCtx({ frame: 2 }), { density: 1, intensity: 1 });
    // Different frame seeds should produce different results
    expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2));
  });

  it('is deterministic for same frame', () => {
    const grid = makeGrid(10, 5);
    const ctx = makeCtx();
    const r1 = effect.apply(grid, ctx, effect.defaults);
    const r2 = effect.apply(grid, ctx, effect.defaults);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
