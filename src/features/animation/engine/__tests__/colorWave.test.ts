import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      char: '#',
      fg: [200, 50, 50] as [number, number, number],
    })),
  );
}

function makeCtx(overrides: Partial<AnimationContext> = {}): AnimationContext {
  return {
    t: 0,
    frame: 0,
    rows: 5,
    cols: 5,
    cycleDuration: 2,
    ...overrides,
  };
}

describe('colorWave effect', () => {
  const effect = EFFECT_REGISTRY.get('colorWave')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('colorWave');
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

  it('applies different hue shifts across columns (horizontal direction)', () => {
    const grid = makeGrid(1, 5);
    const result = effect.apply(grid, makeCtx({ rows: 1, cols: 5 }), {
      direction: 0,
      wavelength: 1,
      speed: 1,
    });
    // Different columns should have different fg colors
    const fgs = result[0].map((cell) => cell.fg!);
    const allSame = fgs.every(
      (fg) => fg[0] === fgs[0][0] && fg[1] === fgs[0][1] && fg[2] === fgs[0][2],
    );
    expect(allSame).toBe(false);
  });

  it('applies different hue shifts across rows (vertical direction)', () => {
    const grid = makeGrid(5, 1);
    const result = effect.apply(grid, makeCtx({ rows: 5, cols: 1 }), {
      direction: 1,
      wavelength: 1,
      speed: 1,
    });
    const fgs = result.map((row) => row[0].fg!);
    const allSame = fgs.every(
      (fg) => fg[0] === fgs[0][0] && fg[1] === fgs[0][1] && fg[2] === fgs[0][2],
    );
    expect(allSame).toBe(false);
  });

  it('produces different results at different t values', () => {
    const grid = makeGrid(3, 3);
    const r1 = effect.apply(grid, makeCtx({ t: 0 }), effect.defaults);
    const r2 = effect.apply(grid, makeCtx({ t: 0.5 }), effect.defaults);
    // Same position, different time -> different hue
    expect(JSON.stringify(r1[0][0].fg)).not.toBe(JSON.stringify(r2[0][0].fg));
  });

  it('preserves character values', () => {
    const grid = makeGrid(3, 3);
    const result = effect.apply(grid, makeCtx(), effect.defaults);
    for (const row of result) {
      for (const cell of row) {
        expect(cell.char).toBe('#');
      }
    }
  });

  it('produces valid RGB values (0-255)', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(grid, makeCtx({ t: 0.7 }), {
      direction: 2,
      wavelength: 2,
      speed: 3,
    });
    for (const row of result) {
      for (const cell of row) {
        expect(cell.fg![0]).toBeGreaterThanOrEqual(0);
        expect(cell.fg![0]).toBeLessThanOrEqual(255);
        expect(cell.fg![1]).toBeGreaterThanOrEqual(0);
        expect(cell.fg![1]).toBeLessThanOrEqual(255);
        expect(cell.fg![2]).toBeGreaterThanOrEqual(0);
        expect(cell.fg![2]).toBeLessThanOrEqual(255);
      }
    }
  });
});
