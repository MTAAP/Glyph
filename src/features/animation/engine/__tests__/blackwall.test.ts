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
    cols: 10,
    cycleDuration: 3,
    ...overrides,
  };
}

describe('blackwall effect', () => {
  const effect = EFFECT_REGISTRY.get('blackwall')!;

  it('is registered with correct metadata', () => {
    expect(effect).toBeDefined();
    expect(effect.key).toBe('blackwall');
    expect(effect.name).toBe('Blackwall');
    expect(effect.defaults).toHaveProperty('intensity');
    expect(effect.defaults).toHaveProperty('corruption');
    expect(effect.defaults).toHaveProperty('speed');
    expect(effect.defaults).toHaveProperty('dripDensity');
  });

  it('returns a new grid (does not mutate input)', () => {
    const grid = makeGrid(5, 5);
    const original = JSON.stringify(grid);
    const result = effect.apply(grid, makeCtx({ rows: 5, cols: 5 }), effect.defaults);
    expect(result).not.toBe(grid);
    expect(JSON.stringify(grid)).toBe(original);
  });

  it('preserves grid dimensions', () => {
    const grid = makeGrid(8, 12);
    const result = effect.apply(grid, makeCtx({ rows: 8, cols: 12 }), effect.defaults);
    expect(result.length).toBe(8);
    expect(result[0].length).toBe(12);
  });

  it('shifts colors toward red tones', () => {
    const grid = makeGrid(5, 5);
    const result = effect.apply(
      grid,
      makeCtx({ rows: 5, cols: 5 }),
      { intensity: 1, corruption: 0, speed: 1, dripDensity: 0 },
    );
    // With full intensity, the red channel should dominate most cells
    let redDominant = 0;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const fg = result[y][x].fg!;
        if (fg[0] > fg[1] && fg[0] > fg[2]) redDominant++;
      }
    }
    expect(redDominant).toBeGreaterThan(15); // majority of 25 cells
  });

  it('produces different output at different times (heartbeat pulse)', () => {
    const grid = makeGrid(5, 5);
    // t=0.0 is on the heartbeat peak, t=0.5 is in the resting phase
    const r1 = effect.apply(grid, makeCtx({ t: 0.0, frame: 0, rows: 5, cols: 5 }), effect.defaults);
    const r2 = effect.apply(grid, makeCtx({ t: 0.5, frame: 15, rows: 5, cols: 5 }), effect.defaults);
    let differs = false;
    for (let y = 0; y < 5 && !differs; y++) {
      for (let x = 0; x < 5 && !differs; x++) {
        if (r1[y][x].fg![0] !== r2[y][x].fg![0]) differs = true;
      }
    }
    expect(differs).toBe(true);
  });

  it('is deterministic (same inputs produce same outputs)', () => {
    const grid = makeGrid(5, 5);
    const ctx = makeCtx({ rows: 5, cols: 5 });
    const r1 = effect.apply(grid, ctx, effect.defaults);
    const r2 = effect.apply(grid, ctx, effect.defaults);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  it('preserves characters when corruption is zero', () => {
    const grid: CharacterGrid = [[{ char: 'A', fg: [100, 100, 100] }]];
    const result = effect.apply(
      grid,
      makeCtx({ rows: 1, cols: 1 }),
      { intensity: 0.85, corruption: 0, speed: 1, dripDensity: 0 },
    );
    expect(result[0][0].char).toBe('A');
  });

  it('handles grid with no fg colors', () => {
    const grid: CharacterGrid = [[{ char: '#' }]];
    const result = effect.apply(grid, makeCtx({ rows: 1, cols: 1 }), effect.defaults);
    expect(result[0][0].fg).toBeDefined();
  });

  it('corruption can replace characters with block elements', () => {
    const grid = makeGrid(30, 30);
    const result = effect.apply(
      grid,
      makeCtx({ rows: 30, cols: 30, frame: 42 }),
      { intensity: 1, corruption: 0.5, speed: 1, dripDensity: 0 },
    );
    // With high corruption, at least some characters should be replaced
    let corrupted = false;
    for (let y = 0; y < 30 && !corrupted; y++) {
      for (let x = 0; x < 30 && !corrupted; x++) {
        if (result[y][x].char !== '#') corrupted = true;
      }
    }
    expect(corrupted).toBe(true);
  });

  it('drip streaks create vertically varying brightness', () => {
    // With high drip density, columns should show brightness variation top-to-bottom
    const grid = makeGrid(20, 20);
    const result = effect.apply(
      grid,
      makeCtx({ t: 0.3, rows: 20, cols: 20 }),
      { intensity: 0.85, corruption: 0, speed: 1, dripDensity: 0.6 },
    );
    // Find a column with varying brightness (drip trail)
    let hasVariation = false;
    for (let x = 0; x < 20 && !hasVariation; x++) {
      const brightnesses = [];
      for (let y = 0; y < 20; y++) {
        const fg = result[y][x].fg!;
        brightnesses.push(fg[0] + fg[1] + fg[2]);
      }
      const minB = Math.min(...brightnesses);
      const maxB = Math.max(...brightnesses);
      if (maxB - minB > 50) hasVariation = true;
    }
    expect(hasVariation).toBe(true);
  });
});
