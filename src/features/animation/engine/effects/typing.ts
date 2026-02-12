import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { seededRandom } from '../utils';

function applyTyping(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const direction = Math.round(params.direction);
  const holdFrames = params.holdFrames;
  const { rows, cols } = ctx;
  const totalCells = rows * cols;

  // Account for hold time at the end of the cycle
  // holdFrames as a fraction of total frames in the cycle
  const totalFrames = ctx.cycleDuration * 30; // assume ~30fps for hold calculation
  const holdFraction = totalFrames > 0 ? holdFrames / totalFrames : 0;
  const revealDuration = Math.max(0.01, 1 - holdFraction);

  // How many cells should be revealed at this point in time
  const revealProgress = Math.min(ctx.t / revealDuration, 1);
  const revealCount = Math.floor(revealProgress * totalCells);

  // Build reveal order based on direction
  let order: [number, number][];
  switch (direction) {
    case 1: // RTL
      order = [];
      for (let y = 0; y < rows; y++)
        for (let x = cols - 1; x >= 0; x--)
          order.push([y, x]);
      break;
    case 2: // random (seeded)
      order = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
          order.push([y, x]);
      // Fisher-Yates shuffle with seeded random
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(i * 137) * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      break;
    case 3: // top-down (column-first)
      order = [];
      for (let x = 0; x < cols; x++)
        for (let y = 0; y < rows; y++)
          order.push([y, x]);
      break;
    default: // 0 = LTR
      order = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
          order.push([y, x]);
      break;
  }

  // Build a set of revealed positions
  const revealed = new Set<string>();
  for (let i = 0; i < revealCount && i < order.length; i++) {
    const [y, x] = order[i];
    revealed.add(`${y},${x}`);
  }

  return grid.map((row, y) =>
    row.map((cell, x) => {
      if (revealed.has(`${y},${x}`)) {
        return {
          char: cell.char,
          fg: cell.fg ? ([...cell.fg] as RGB) : undefined,
          bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
        };
      }
      // Not yet revealed: empty cell
      return {
        char: ' ',
        fg: cell.fg ? ([...cell.fg] as RGB) : undefined,
        bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
      };
    }),
  );
}

registerEffect({
  key: 'typing',
  name: 'Typing',
  description: 'Sequential character reveal like a typewriter',
  defaults: { direction: 0, holdFrames: 2 },
  paramMeta: {
    direction: { label: 'Direction', min: 0, max: 3, step: 1 },
    holdFrames: { label: 'Hold Frames', min: 0, max: 10, step: 1 },
  },
  apply: applyTyping,
});
