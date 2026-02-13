import '../effects';
import { applyEffectPipeline } from '../pipeline';
import { EFFECT_REGISTRY } from '../registry';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';

function makeGrid(rows: number, cols: number, char = '#'): CharacterGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      char,
      fg: [100, 150, 200] as [number, number, number],
    })),
  );
}

function makeCtx(overrides: Partial<AnimationContext> = {}): AnimationContext {
  return {
    t: 0.5,
    frame: 15,
    rows: 3,
    cols: 3,
    cycleDuration: 2,
    ...overrides,
  };
}

describe('applyEffectPipeline', () => {
  it('returns the base grid unchanged when no effects are provided', () => {
    const grid = makeGrid(3, 3);
    const result = applyEffectPipeline(grid, [], makeCtx());
    expect(result).toBe(grid);
  });

  it('applies a single registered effect', () => {
    const grid = makeGrid(3, 3);
    const ctx = makeCtx();
    const result = applyEffectPipeline(
      grid,
      [{ key: 'flicker', params: { intensity: 1, brightnessBoost: 1 } }],
      ctx,
    );
    expect(result).not.toBe(grid);
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(3);
  });

  it('chains multiple effects in order', () => {
    const grid = makeGrid(3, 3);
    const ctx = makeCtx();
    const result = applyEffectPipeline(
      grid,
      [
        { key: 'scanline', params: {} },
        { key: 'flicker', params: { intensity: 1, brightnessBoost: 0.5 } },
      ],
      ctx,
    );
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(3);
  });

  it('silently skips unknown effect keys', () => {
    const grid = makeGrid(3, 3);
    const ctx = makeCtx();
    const result = applyEffectPipeline(
      grid,
      [{ key: 'nonexistent', params: {} }],
      ctx,
    );
    // Should return the base grid since the unknown effect was skipped
    expect(result).toBe(grid);
  });

  it('skips unknown effects but still applies known ones', () => {
    const grid = makeGrid(3, 3);
    const ctx = makeCtx();
    const result = applyEffectPipeline(
      grid,
      [
        { key: 'nonexistent', params: {} },
        { key: 'flicker', params: { intensity: 1, brightnessBoost: 1 } },
      ],
      ctx,
    );
    expect(result).not.toBe(grid);
    expect(result.length).toBe(3);
  });

  it('registers all 7 effects', () => {
    const expectedKeys = [
      'colorPulse', 'scanline', 'glitch', 'rain', 'flicker', 'colorWave', 'typing',
    ];
    for (const key of expectedKeys) {
      expect(EFFECT_REGISTRY.has(key)).toBe(true);
    }
  });

  it('handles empty grid input', () => {
    const grid: CharacterGrid = [];
    const result = applyEffectPipeline(
      grid,
      [{ key: 'flicker', params: {} }],
      makeCtx({ rows: 0, cols: 0 }),
    );
    expect(result.length).toBe(0);
  });
});
