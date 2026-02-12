import type { RGB } from './types';

export const CYBERPUNK_NEON: RGB[] = [
  [255, 20, 147],
  [0, 255, 255],
  [148, 0, 211],
  [0, 100, 255],
];

export const BLADE_RUNNER: RGB[] = [
  [255, 176, 0],
  [0, 128, 128],
  [25, 25, 112],
  [255, 222, 173],
];

export const MATRIX: RGB[] = [
  [0, 255, 0],
  [0, 200, 0],
  [0, 150, 0],
  [0, 100, 0],
];

export const VAPORWAVE: RGB[] = [
  [255, 105, 180],
  [186, 85, 211],
  [0, 255, 255],
  [255, 0, 255],
];

export const FIRE: RGB[] = [
  [255, 0, 0],
  [255, 140, 0],
  [255, 255, 0],
  [139, 0, 0],
];

export type PaletteName = 'cyberpunkNeon' | 'bladeRunner' | 'matrix' | 'vaporwave' | 'fire';

export const PALETTES: Record<PaletteName, RGB[]> = {
  cyberpunkNeon: CYBERPUNK_NEON,
  bladeRunner: BLADE_RUNNER,
  matrix: MATRIX,
  vaporwave: VAPORWAVE,
  fire: FIRE,
};

export function getPalette(name: PaletteName): RGB[] {
  return PALETTES[name];
}
