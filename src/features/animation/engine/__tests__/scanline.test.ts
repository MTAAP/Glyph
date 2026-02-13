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

describe('scanline effect', () => {
  const effect = EFFECT_REGISTRY.get('scanline')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('scanline');
  });

  it('returns a new grid (does not mutate input)', () => {
    const grid = makeGrid(5, 5);
    const original = JSON.stringify(grid);
    const result = effect.apply(grid, makeCtx({ rows: 5 }), effect.defaults);
    expect(result).not.toBe(grid);
    expect(JSON.stringify(grid)).toBe(original);
  });

  it('preserves grid dimensions', () => {
    const grid = makeGrid(10, 5);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result.length).toBe(10);
    expect(result[0].length).toBe(5);
  });

  it('brightens cells at the band position', () => {
    // At t=0.5, rows=10, bandCenter = 5
    const grid = makeGrid(10, 3);
    const result = effect.apply(grid, makeCtx(), { bandWidth: 3, dimAmount: 0.8 });
    const bandCell = result[5][0];
    // Band cell should be brightened (closer to 255 than original 100)
    expect(bandCell.fg![0]).toBeGreaterThan(100);
  });

  it('dims cells outside the band', () => {
    // At t=0.5, rows=10, bandCenter = 5, bandWidth = 3
    const grid = makeGrid(10, 3);
    const result = effect.apply(grid, makeCtx(), { bandWidth: 3, dimAmount: 0.8 });
    // Row 0 is far from band center at row 5
    const dimmedCell = result[0][0];
    expect(dimmedCell.fg![0]).toBeLessThan(100);
  });

  it('band position changes with t', () => {
    const grid = makeGrid(10, 3);
    const r1 = effect.apply(grid, makeCtx({ t: 0.1 }), effect.defaults);
    const r2 = effect.apply(grid, makeCtx({ t: 0.9 }), effect.defaults);
    // At t=0.1, band near top; at t=0.9, band near bottom
    // Row 1 should be brighter at t=0.1 than at t=0.9
    expect(r1[1][0].fg![0]).toBeGreaterThan(r2[1][0].fg![0]);
  });
});
