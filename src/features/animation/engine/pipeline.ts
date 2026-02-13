import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, ActiveEffect } from './types';
import { EFFECT_REGISTRY } from './registry';

export function applyEffectPipeline(
  baseGrid: CharacterGrid,
  effects: ActiveEffect[],
  ctx: AnimationContext,
): CharacterGrid {
  if (effects.length === 0) return baseGrid;

  let grid = baseGrid;

  for (const effect of effects) {
    const def = EFFECT_REGISTRY.get(effect.key);
    if (!def) continue;

    const params = { ...def.defaults, ...effect.params };
    grid = def.apply(grid, ctx, params);
  }

  return grid;
}
