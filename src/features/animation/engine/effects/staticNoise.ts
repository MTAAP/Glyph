import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { seededRandom } from '../utils';

const NOISE_CHARS = '░▒▓█#@%&*!?/\\|=-+~^';

function applyStaticNoise(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const density = params.density;
  const intensity = params.intensity;
  const baseSeed = ctx.frame * 1000;

  return grid.map((row, y) =>
    row.map((cell, x) => {
      const cellSeed = baseSeed + y * 997 + x * 31;
      const rng = seededRandom(cellSeed);

      if (rng >= density) {
        // Not affected — pass through
        return {
          char: cell.char,
          fg: cell.fg ? ([...cell.fg] as RGB) : undefined,
          bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
        };
      }

      // Replace with noise character
      const charIdx = Math.floor(seededRandom(cellSeed + 1) * NOISE_CHARS.length);
      const noiseChar = NOISE_CHARS[charIdx];

      // Generate random noise color based on intensity
      const colorBase = Math.round(seededRandom(cellSeed + 2) * 255 * intensity);
      const r = Math.min(255, Math.round(colorBase + seededRandom(cellSeed + 3) * 100 * intensity));
      const g = Math.min(255, Math.round(colorBase + seededRandom(cellSeed + 4) * 100 * intensity));
      const b = Math.min(255, Math.round(colorBase + seededRandom(cellSeed + 5) * 100 * intensity));

      return {
        char: noiseChar,
        fg: [r, g, b] as RGB,
        bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
      };
    }),
  );
}

registerEffect({
  key: 'staticNoise',
  name: 'Static Noise',
  description: 'Random characters and colors at random positions — TV static effect',
  defaults: { density: 0.3, intensity: 0.8 },
  paramMeta: {
    density: { label: 'Density', min: 0, max: 1, step: 0.05 },
    intensity: { label: 'Intensity', min: 0, max: 1, step: 0.05 },
  },
  apply: applyStaticNoise,
});
