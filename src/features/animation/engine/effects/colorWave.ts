import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { rgbToHsl, hslToRgb } from '@/shared/utils/color';

function applyColorWave(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const direction = Math.round(params.direction);
  const wavelength = params.wavelength;
  const speed = params.speed;
  const timeOffset = ctx.t * speed * 360;

  return grid.map((row, y) =>
    row.map((cell, x) => {
      const baseFg: RGB = cell.fg ?? [200, 200, 200];

      // Calculate position-based offset
      let positionFactor: number;
      switch (direction) {
        case 1: // vertical
          positionFactor = y / ctx.rows;
          break;
        case 2: // diagonal
          positionFactor = (x / ctx.cols + y / ctx.rows) / 2;
          break;
        default: // 0 = horizontal
          positionFactor = x / ctx.cols;
          break;
      }

      const hueShift = (positionFactor * 360 * wavelength + timeOffset) % 360;
      const [h, s, l] = rgbToHsl(baseFg[0], baseFg[1], baseFg[2]);
      const newH = (h + hueShift) % 360;
      const newFg = hslToRgb(newH, Math.max(s, 0.5), l);

      return {
        char: cell.char,
        fg: newFg,
        bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
      };
    }),
  );
}

registerEffect({
  key: 'colorWave',
  name: 'Color Wave',
  description: 'Hue-rotation gradient sweep across the grid',
  defaults: { direction: 0, wavelength: 1, speed: 1 },
  paramMeta: {
    direction: { label: 'Direction', min: 0, max: 2, step: 1 },
    wavelength: { label: 'Wavelength', min: 0.2, max: 3, step: 0.1 },
    speed: { label: 'Speed', min: 0.5, max: 3, step: 0.1 },
  },
  apply: applyColorWave,
});
