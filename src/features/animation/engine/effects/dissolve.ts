import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';
import { registerEffect } from '../registry';
import { seededRandom, cloneCell } from '../utils';

function applyDissolve(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const speed = params.speed;
  const density = params.density;
  const { cols } = ctx;

  // Progress determines how much of the grid is visible (0 = empty, 1 = full)
  const progress = Math.min(1, ctx.t * speed) * density;

  return grid.map((row, y) =>
    row.map((cell, x) => {
      // Each cell gets a stable threshold based on position
      const threshold = seededRandom(y * cols + x + 42);

      if (threshold < progress) {
        // Cell is visible — pass through with original colors
        return cloneCell(cell);
      }

      // Cell is hidden — show as empty space
      return {
        char: ' ',
        fg: undefined,
        bg: cell.bg ? ([...cell.bg] as [number, number, number]) : undefined,
      };
    }),
  );
}

registerEffect({
  key: 'dissolve',
  name: 'Dissolve',
  description: 'Characters randomly appear like particles dissolving into view',
  defaults: { speed: 1, density: 1 },
  paramMeta: {
    speed: { label: 'Speed', min: 0.5, max: 3, step: 0.1 },
    density: { label: 'Density', min: 0.1, max: 1, step: 0.05 },
  },
  apply: applyDissolve,
});
