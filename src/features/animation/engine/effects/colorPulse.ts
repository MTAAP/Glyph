import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { blendColor } from '../utils';
import { type PaletteName, getPalette } from '../palettes';

const PALETTE_NAMES: PaletteName[] = [
  'cyberpunkNeon',
  'bladeRunner',
  'matrix',
  'vaporwave',
  'fire',
];

function applyColorPulse(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const intensity = params.intensity;
  const speed = params.speed;
  const paletteName = PALETTE_NAMES[Math.round(params.paletteIndex)] ?? 'cyberpunkNeon';
  const palette = getPalette(paletteName);

  const phase = (ctx.t * speed) % 1;
  const palettePos = phase * palette.length;
  const idx = Math.floor(palettePos);
  const frac = palettePos - idx;

  // Interpolate between current and next palette color
  const colorA = palette[idx % palette.length];
  const colorB = palette[(idx + 1) % palette.length];
  const targetColor = blendColor(colorA, colorB, frac);

  return grid.map((row) =>
    row.map((cell) => {
      const baseFg: RGB = cell.fg ?? [200, 200, 200];
      const blended = blendColor(baseFg, targetColor, intensity);
      return {
        char: cell.char,
        fg: blended,
        bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
      };
    }),
  );
}

registerEffect({
  key: 'colorPulse',
  name: 'Color Pulse',
  description: 'Cycles foreground colors through a named palette over time',
  defaults: { intensity: 0.7, paletteIndex: 0, speed: 1 },
  paramMeta: {
    intensity: { label: 'Intensity', min: 0, max: 1, step: 0.05 },
    paletteIndex: { label: 'Palette', min: 0, max: 4, step: 1 },
    speed: { label: 'Speed', min: 0.5, max: 3, step: 0.1 },
  },
  apply: applyColorPulse,
});
