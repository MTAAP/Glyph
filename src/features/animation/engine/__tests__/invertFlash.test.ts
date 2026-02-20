import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      char: '#',
      fg: [100, 100, 100] as [number, number, number],
      bg: [20, 20, 20] as [number, number, number],
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

describe('invertFlash effect', () => {
  const effect = EFFECT_REGISTRY.get('invertFlash')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('invertFlash');
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

  it('preserves characters regardless of flash state', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ rows: 5, cols: 5 }), effect.defaults);
    for (const row of result) {
      for (const cell of row) {
        expect(cell.char).toBe('#');
      }
    }
  });

  it('swaps fg and bg during flash', () => {
    const grid = makeGrid(5, 5);
    // frequency=2, duration=0.5 means flash is active for first half of each segment
    // At t=0 (start of first segment), position=0 < 0.5, so flashing
    const result = effect.apply(grid, makeCtx({ t: 0, rows: 5, cols: 5 }), { frequency: 2, duration: 0.5 });
    // During flash: fg should become old bg, bg should become old fg
    expect(result[0][0].fg).toEqual([20, 20, 20]);
    expect(result[0][0].bg).toEqual([100, 100, 100]);
  });

  it('passes through when not flashing', () => {
    const grid = makeGrid(5, 5);
    // frequency=1, duration=0.1 means flash only in first 10% of cycle
    // At t=0.5, position in segment = 0.5 >= 0.1, so NOT flashing
    const result = effect.apply(grid, makeCtx({ t: 0.5, rows: 5, cols: 5 }), { frequency: 1, duration: 0.1 });
    expect(result[0][0].fg).toEqual([100, 100, 100]);
    expect(result[0][0].bg).toEqual([20, 20, 20]);
  });

  it('handles cells with only fg (no bg)', () => {
    const grid: CharacterGrid = [[{ char: 'A', fg: [200, 100, 50] }]];
    // At t=0, frequency=1, duration=0.5 → flashing
    const result = effect.apply(grid, makeCtx({ t: 0, rows: 1, cols: 1 }), { frequency: 1, duration: 0.5 });
    // No bg to swap with — fg gets inverted
    expect(result[0][0].fg).toEqual([55, 155, 205]);
    expect(result[0][0].bg).toEqual([200, 100, 50]);
  });

  it('handles empty grid', () => {
    const grid: CharacterGrid = [];
    const result = effect.apply(grid, makeCtx({ rows: 0, cols: 0 }), effect.defaults);
    expect(result.length).toBe(0);
  });

  it('is deterministic', () => {
    const grid = makeGrid(10, 5);
    const ctx = makeCtx();
    const r1 = effect.apply(grid, ctx, effect.defaults);
    const r2 = effect.apply(grid, ctx, effect.defaults);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
