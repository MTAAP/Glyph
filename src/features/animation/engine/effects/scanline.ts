import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { brightenRgb, dimRgb, cloneCell } from '../utils';

function applyScanline(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const bandWidth = params.bandWidth;
  const dimAmount = params.dimAmount;
  const bandCenter = ctx.t * ctx.rows;

  return grid.map((row, y) =>
    row.map((cell) => {
      const distance = Math.abs(y - bandCenter);
      const baseFg: RGB = cell.fg ?? [200, 200, 200];
      const cloned = cloneCell(cell);

      if (distance < bandWidth / 2) {
        // Inside band: brighten proportional to proximity
        const strength = 1 - distance / (bandWidth / 2);
        cloned.fg = brightenRgb(baseFg, strength * 0.5);
        return cloned;
      }

      // Outside band: dim
      cloned.fg = dimRgb(baseFg, dimAmount);
      return cloned;
    }),
  );
}

registerEffect({
  key: 'scanline',
  name: 'Scanline',
  description: 'Bright horizontal band sweeps down the grid',
  defaults: { bandWidth: 3, dimAmount: 0.5 },
  paramMeta: {
    bandWidth: { label: 'Band Width', min: 1, max: 20, step: 1 },
    dimAmount: { label: 'Dim Amount', min: 0, max: 1, step: 0.05 },
  },
  apply: applyScanline,
});
