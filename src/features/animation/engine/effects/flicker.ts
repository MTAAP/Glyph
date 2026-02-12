import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { seededRandom, brightenRgb } from '../utils';

function applyFlicker(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const intensity = params.intensity;
  const brightnessBoost = params.brightnessBoost;
  const baseSeed = ctx.frame * 1000;

  return grid.map((row, y) =>
    row.map((cell, x) => {
      const rng = seededRandom(baseSeed + y * 61 + x * 43);

      if (rng < intensity) {
        const baseFg: RGB = cell.fg ?? [200, 200, 200];
        return {
          char: cell.char,
          fg: brightenRgb(baseFg, brightnessBoost),
          bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
        };
      }

      return {
        char: cell.char,
        fg: cell.fg ? ([...cell.fg] as RGB) : undefined,
        bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
      };
    }),
  );
}

registerEffect({
  key: 'flicker',
  name: 'Flicker',
  description: 'Random cell brightness flashing',
  defaults: { intensity: 0.3, brightnessBoost: 0.8 },
  paramMeta: {
    intensity: { label: 'Intensity', min: 0, max: 1, step: 0.05 },
    brightnessBoost: { label: 'Brightness', min: 0.2, max: 2, step: 0.1 },
  },
  apply: applyFlicker,
});
