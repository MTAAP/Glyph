import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { seededRandom, brightenRgb, dimRgb, cloneCell } from '../utils';

const HEAD_COLOR: RGB = [200, 255, 200];
const TRAIL_COLOR: RGB = [0, 180, 0];

function applyRain(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const density = params.density;
  const speed = params.speed;
  const trailLength = params.trailLength;
  const { rows, cols } = ctx;

  // Determine which columns have active drops and their head positions
  // Use a stable seed per column so drops persist across frames
  const drops: { headY: number }[] = [];
  for (let col = 0; col < cols; col++) {
    const colSeed = col * 997;
    const isActive = seededRandom(colSeed) < density;
    if (isActive) {
      // Head position cycles through the column based on time
      const totalTravel = rows + trailLength;
      const offset = seededRandom(colSeed + 1) * totalTravel;
      const headY = ((ctx.t * speed * totalTravel + offset) % totalTravel) - trailLength;
      drops.push({ headY });
    } else {
      drops.push({ headY: -trailLength - 1 }); // Off-screen
    }
  }

  return grid.map((row, y) =>
    row.map((cell, x) => {
      const drop = drops[x];
      const distFromHead = y - drop.headY;

      // Cell is above the head or below the trail: keep original but dim slightly
      if (distFromHead < 0 || distFromHead > trailLength) {
        const cloned = cloneCell(cell);
        if (cloned.fg) cloned.fg = dimRgb(cloned.fg, 0.3);
        return cloned;
      }

      // Head cell: bright white-green
      if (distFromHead < 1) {
        const cloned = cloneCell(cell);
        cloned.fg = brightenRgb(HEAD_COLOR, 0.3);
        return cloned;
      }

      // Trail: fade from bright green to dim
      const fade = 1 - distFromHead / trailLength;
      const trailFg: RGB = [
        Math.round(TRAIL_COLOR[0] * fade),
        Math.round(TRAIL_COLOR[1] * fade),
        Math.round(TRAIL_COLOR[2] * fade),
      ];

      const cloned = cloneCell(cell);
      cloned.fg = trailFg;
      return cloned;
    }),
  );
}

registerEffect({
  key: 'rain',
  name: 'Matrix Rain',
  description: 'Matrix-style falling characters with bright heads and dimming trails',
  defaults: { density: 0.3, speed: 1, trailLength: 8 },
  paramMeta: {
    density: { label: 'Density', min: 0, max: 1, step: 0.05 },
    speed: { label: 'Speed', min: 0.5, max: 3, step: 0.1 },
    trailLength: { label: 'Trail Length', min: 3, max: 20, step: 1 },
  },
  apply: applyRain,
});
