import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { seededRandom, cloneCell } from '../utils';

const GLITCH_CHARS = '!@#$%^&*░▒▓█';

function applyGlitch(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const intensity = params.intensity;
  const charCorruption = params.charCorruption;
  const rowShift = params.rowShift;
  const colorSplit = params.colorSplit;
  const baseSeed = ctx.frame * 1000;

  // Start with a clone via map
  let result: CharacterGrid = grid.map((row) => row.map(cloneCell));

  // Row shifting: randomly offset entire rows
  if (rowShift > 0) {
    result = result.map((row, y) => {
      const rng = seededRandom(baseSeed + y * 7);
      if (rng < intensity) {
        const shift = Math.round((seededRandom(baseSeed + y * 13) - 0.5) * 2 * rowShift);
        return row.map((_, x) => {
          const srcX = ((x - shift) % row.length + row.length) % row.length;
          return cloneCell(row[srcX]);
        });
      }
      return row;
    });
  }

  // Character corruption
  if (charCorruption > 0) {
    result = result.map((row, y) =>
      row.map((cell, x) => {
        const rng = seededRandom(baseSeed + y * 31 + x * 17);
        if (rng < charCorruption * intensity) {
          const charIdx = Math.floor(seededRandom(baseSeed + y * 41 + x * 23) * GLITCH_CHARS.length);
          return { ...cell, char: GLITCH_CHARS[charIdx] };
        }
        return cell;
      }),
    );
  }

  // Color split: offset RGB channels
  if (colorSplit > 0) {
    result = result.map((row, y) =>
      row.map((cell, x) => {
        if (!cell.fg) return cell;
        const rng = seededRandom(baseSeed + y * 53 + x * 37);
        if (rng < intensity) {
          const offset = Math.round(colorSplit);
          const leftX = Math.max(0, x - offset);
          const rightX = Math.min(row.length - 1, x + offset);
          const leftCell = grid[y]?.[leftX];
          const rightCell = grid[y]?.[rightX];
          const r = leftCell?.fg?.[0] ?? cell.fg[0];
          const g = cell.fg[1];
          const b = rightCell?.fg?.[2] ?? cell.fg[2];
          return { ...cell, fg: [r, g, b] as RGB };
        }
        return cell;
      }),
    );
  }

  return result;
}

registerEffect({
  key: 'glitch',
  name: 'Glitch',
  description: 'Random character corruption, row shifting, and color split',
  defaults: { intensity: 0.3, charCorruption: 0.15, rowShift: 2, colorSplit: 1 },
  paramMeta: {
    intensity: { label: 'Intensity', min: 0, max: 1, step: 0.05 },
    charCorruption: { label: 'Corruption', min: 0, max: 1, step: 0.05 },
    rowShift: { label: 'Row Shift', min: 0, max: 10, step: 1 },
    colorSplit: { label: 'Color Split', min: 0, max: 5, step: 1 },
  },
  apply: applyGlitch,
});
