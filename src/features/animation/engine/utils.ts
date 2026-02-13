import type { CharacterGrid } from '@/shared/types';
import type { RGB } from './types';

export function cloneGrid(grid: CharacterGrid): CharacterGrid {
  return grid.map((row) =>
    row.map((cell) => ({
      char: cell.char,
      fg: cell.fg ? ([...cell.fg] as RGB) : undefined,
      bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
    })),
  );
}

export function brightenRgb(color: RGB, amount: number): RGB {
  return [
    Math.min(255, Math.round(color[0] + (255 - color[0]) * amount)),
    Math.min(255, Math.round(color[1] + (255 - color[1]) * amount)),
    Math.min(255, Math.round(color[2] + (255 - color[2]) * amount)),
  ];
}

export function dimRgb(color: RGB, amount: number): RGB {
  return [
    Math.max(0, Math.round(color[0] * (1 - amount))),
    Math.max(0, Math.round(color[1] * (1 - amount))),
    Math.max(0, Math.round(color[2] * (1 - amount))),
  ];
}

export function blendColor(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// Deterministic PRNG using sin-based hash
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
