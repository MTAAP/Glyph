import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      char: '*',
      fg: [80, 80, 80] as [number, number, number],
    })),
  );
}

function makeCtx(overrides: Partial<AnimationContext> = {}): AnimationContext {
  return {
    t: 0.5,
    frame: 10,
    rows: 5,
    cols: 5,
    cycleDuration: 2,
    ...overrides,
  };
}

describe('flicker effect', () => {
  const effect = EFFECT_REGISTRY.get('flicker')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('flicker');
  });

  it('returns a new grid (does not mutate input)', () => {
    const grid = makeGrid(5, 5);
    const original = JSON.stringify(grid);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result).not.toBe(grid);
    expect(JSON.stringify(grid)).toBe(original);
  });

  it('preserves grid dimensions', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result.length).toBe(5);
    expect(result[0].length).toBe(5);
  });

  it('brightens some cells at high intensity', () => {
    const grid = makeGrid(10, 10);
    const result = effect.apply(grid, makeCtx({ rows: 10, cols: 10 }), {
      intensity: 1,
      brightnessBoost: 1,
    });
    // With intensity=1, all cells should be brightened
    const brightened = result.flatMap((row) =>
      row.filter((cell) => cell.fg && cell.fg[0] > 80),
    );
    expect(brightened.length).toBeGreaterThan(0);
  });

  it('at zero intensity, no cells are brightened', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx(), { intensity: 0, brightnessBoost: 1 });
    for (const row of result) {
      for (const cell of row) {
        expect(cell.fg).toEqual([80, 80, 80]);
      }
    }
  });

  it('is deterministic', () => {
    const grid = makeGrid(5, 5);
    const ctx = makeCtx();
    const r1 = effect.apply(grid, ctx, effect.defaults);
    const r2 = effect.apply(grid, ctx, effect.defaults);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('preserves character values', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    for (const row of result) {
      for (const cell of row) {
        expect(cell.char).toBe('*');
      }
    }
  });
});
