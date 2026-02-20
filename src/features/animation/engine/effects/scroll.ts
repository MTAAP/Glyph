import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../types';
import { registerEffect } from '../registry';
import { cloneCell } from '../utils';

function applyScroll(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const direction = params.direction; // 0=left, 1=right, 2=up, 3=down
  const speed = params.speed;
  const { rows, cols } = ctx;

  // Calculate pixel offset based on time and speed
  const offset = Math.round(ctx.t * speed * (direction < 2 ? cols : rows));

  return grid.map((row, y) =>
    row.map((_cell, x) => {
      let srcX = x;
      let srcY = y;

      if (direction === 0) {
        // Left: shift content left, wrap around
        srcX = (x + offset) % cols;
      } else if (direction === 1) {
        // Right: shift content right, wrap around
        srcX = ((x - offset) % cols + cols) % cols;
      } else if (direction === 2) {
        // Up: shift content up, wrap around
        srcY = (y + offset) % rows;
      } else {
        // Down: shift content down, wrap around
        srcY = ((y - offset) % rows + rows) % rows;
      }

      const src = grid[srcY]?.[srcX];
      if (!src) return { char: ' ' };

      return cloneCell(src);
    }),
  );
}

registerEffect({
  key: 'scroll',
  name: 'Scroll',
  description: 'Shifts the grid horizontally or vertically with wrapping, creating a marquee effect',
  defaults: { direction: 0, speed: 1 },
  paramMeta: {
    direction: { label: 'Direction', min: 0, max: 3, step: 1 },
    speed: { label: 'Speed', min: 0.5, max: 5, step: 0.5 },
  },
  apply: applyScroll,
});
