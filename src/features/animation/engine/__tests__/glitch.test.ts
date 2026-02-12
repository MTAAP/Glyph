import '../effects';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number): CharacterGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      char: 'A',
      fg: [100, 150, 200] as [number, number, number],
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

describe('glitch effect', () => {
  const effect = EFFECT_REGISTRY.get('glitch')!;

  it('is registered', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('glitch');
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

  it('is deterministic (same inputs produce same outputs)', () => {
    const grid = makeGrid(5, 5);
    const ctx = makeCtx({ frame: 42 });
    const params = { intensity: 0.5, charCorruption: 0.3, rowShift: 2, colorSplit: 1 };
    const r1 = effect.apply(grid, ctx, params);
    const r2 = effect.apply(grid, ctx, params);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('produces different output for different frames', () => {
    const grid = makeGrid(5, 5);
    const params = { intensity: 1, charCorruption: 1, rowShift: 5, colorSplit: 3 };
    const r1 = effect.apply(grid, makeCtx({ frame: 1 }), params);
    const r2 = effect.apply(grid, makeCtx({ frame: 2 }), params);
    // With high corruption, different frames should yield different results
    expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2));
  });

  it('corrupts characters at high corruption intensity', () => {
    const grid = makeGrid(5, 5);
    const params = { intensity: 1, charCorruption: 1, rowShift: 0, colorSplit: 0 };
    const result = effect.apply(grid, makeCtx(), params);
    // At least some characters should differ from 'A'
    const allChars = result.flatMap((row) => row.map((cell) => cell.char));
    const corrupted = allChars.filter((c) => c !== 'A');
    expect(corrupted.length).toBeGreaterThan(0);
  });

  it('at zero intensity, preserves all characters', () => {
    const grid = makeGrid(3, 3);
    const params = { intensity: 0, charCorruption: 1, rowShift: 10, colorSplit: 5 };
    const result = effect.apply(grid, makeCtx(), params);
    for (const row of result) {
      for (const cell of row) {
        expect(cell.char).toBe('A');
      }
    }
  });
});
