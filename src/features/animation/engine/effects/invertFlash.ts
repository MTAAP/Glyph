import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { cloneCell } from '../utils';

function applyInvertFlash(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const frequency = params.frequency;
  const duration = params.duration;

  // Determine if we're currently in a flash
  // Divide the cycle into `frequency` equal segments
  // Each segment has an active portion of `duration` fraction
  const segmentLength = 1 / frequency;
  const positionInSegment = (ctx.t % segmentLength) / segmentLength;
  const isFlashing = positionInSegment < duration;

  if (!isFlashing) {
    // Pass through unchanged (still clone to avoid mutation)
    return grid.map((row) => row.map(cloneCell));
  }

  // Invert: swap fg and bg colors
  return grid.map((row) =>
    row.map((cell) => {
      const invertedFg: RGB | undefined = cell.bg
        ? ([...cell.bg] as RGB)
        : cell.fg
          ? ([255 - cell.fg[0], 255 - cell.fg[1], 255 - cell.fg[2]] as RGB)
          : undefined;

      const invertedBg: RGB | undefined = cell.fg
        ? ([...cell.fg] as RGB)
        : cell.bg
          ? ([255 - cell.bg[0], 255 - cell.bg[1], 255 - cell.bg[2]] as RGB)
          : undefined;

      return {
        char: cell.char,
        fg: invertedFg,
        bg: invertedBg,
      };
    }),
  );
}

registerEffect({
  key: 'invertFlash',
  name: 'Invert Flash',
  description: 'Brief full-grid color inversion like a camera flash or lightning strike',
  defaults: { frequency: 2, duration: 0.15 },
  paramMeta: {
    frequency: { label: 'Frequency', min: 1, max: 10, step: 1 },
    duration: { label: 'Duration', min: 0.05, max: 0.5, step: 0.05 },
  },
  apply: applyInvertFlash,
});
