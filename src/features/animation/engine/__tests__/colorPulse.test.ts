import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      char: '@',
      fg: [100, 100, 100] as [number, number, number],
    })),
  );
}

function makeCtx(overrides: Partial<AnimationContext> = {}): AnimationContext {
  return {
    t: 0,
    frame: 0,
    rows: 3,
    cols: 3,
    cycleDuration: 2,
    ...overrides,
  };
}

describe('colorPulse effect', () => {
  const effect = EFFECT_REGISTRY.get('colorPulse')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('colorPulse');
  });

  it('returns a new grid (does not mutate input)', () => {
    const grid = makeGrid(3, 3);
    const original = JSON.stringify(grid);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    expect(result).not.toBe(grid);
    expect(JSON.stringify(grid)).toBe(original);
  });

  it('preserves grid dimensions', () => {
    const grid = makeGrid(4, 5);
    const result = effect.apply(grid, makeCtx({ rows: 4, cols: 5 }), effect.defaults);
    expect(result.length).toBe(4);
    expect(result[0].length).toBe(5);
  });

  it('blends foreground colors toward palette colors', () => {
    const grid = makeGrid(2, 2);
    const result = effect.apply(grid, makeCtx(), { intensity: 1, paletteIndex: 0, speed: 1 });
    // At t=0, speed=1, palette position is 0 -> first color of cyberpunkNeon [255,20,147]
    // With intensity=1, fg should be fully the palette color
    const cell = result[0][0];
    expect(cell.fg).toBeDefined();
    expect(cell.fg![0]).toBe(255); // fully blended to palette red channel
  });

  it('at intensity 0, colors remain unchanged', () => {
    const grid = makeGrid(2, 2);
    const result = effect.apply(grid, makeCtx(), { intensity: 0, paletteIndex: 0, speed: 1 });
    const cell = result[0][0];
    expect(cell.fg).toEqual([100, 100, 100]);
  });

  it('produces different results at different t values', () => {
    const grid = makeGrid(2, 2);
    const r1 = effect.apply(grid, makeCtx({ t: 0 }), effect.defaults);
    const r2 = effect.apply(grid, makeCtx({ t: 0.5 }), effect.defaults);
    // At different time positions, the palette position differs
    const fg1 = r1[0][0].fg!;
    const fg2 = r2[0][0].fg!;
    expect(fg1[0] !== fg2[0] || fg1[1] !== fg2[1] || fg1[2] !== fg2[2]).toBe(true);
  });

  it('preserves character values', () => {
    const grid = makeGrid(2, 2);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    for (const row of result) {
      for (const cell of row) {
        expect(cell.char).toBe('@');
      }
    }
  });
});
