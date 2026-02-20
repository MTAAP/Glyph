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

describe('dissolve effect', () => {
  const effect = EFFECT_REGISTRY.get('dissolve')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('dissolve');
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

  it('at t=0 shows mostly empty cells', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ t: 0, rows: 5, cols: 5 }), { speed: 1, density: 1 });
    const visibleCount = result.flat().filter((c) => c.char !== ' ').length;
    // At t=0, progress=0, so no cells should be visible
    expect(visibleCount).toBe(0);
  });

  it('at t=1 with density=1 shows all cells', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ t: 1, rows: 5, cols: 5 }), { speed: 1, density: 1 });
    const visibleCount = result.flat().filter((c) => c.char !== ' ').length;
    expect(visibleCount).toBe(25);
  });

  it('at t=0.5 shows a partial subset', () => {
    const grid = makeGrid(10, 10);
    const result = effect.apply(grid, makeCtx({ t: 0.5, rows: 10, cols: 10 }), { speed: 1, density: 1 });
    const visibleCount = result.flat().filter((c) => c.char !== ' ').length;
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThan(100);
  });

  it('handles empty grid', () => {
    const grid: CharacterGrid = [];
    const result = effect.apply(grid, makeCtx({ rows: 0, cols: 0 }), effect.defaults);
    expect(result.length).toBe(0);
  });

  it('density=0 keeps all cells hidden at any t', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ t: 1, rows: 5, cols: 5 }), { speed: 1, density: 0 });
    const visibleCount = result.flat().filter((c) => c.char !== ' ').length;
    expect(visibleCount).toBe(0);
  });

  it('is deterministic', () => {
    const grid = makeGrid(10, 5);
    const ctx = makeCtx();
    const r1 = effect.apply(grid, ctx, effect.defaults);
    const r2 = effect.apply(grid, ctx, effect.defaults);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
