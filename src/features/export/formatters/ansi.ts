import type { CharacterGrid } from '@/shared/types/index.ts';
import { rgbToAnsi256, rgbToAnsi8 } from '@/shared/utils/color.ts';

function isBright(r: number, g: number, b: number): boolean {
  return r > 170 || g > 170 || b > 170;
}

function fgEscape(
  rgb: [number, number, number],
  depth: 8 | 16 | 256 | 'truecolor',
): string {
  const [r, g, b] = rgb;
  switch (depth) {
    case 'truecolor':
      return `\x1b[38;2;${r};${g};${b}m`;
    case 256:
      return `\x1b[38;5;${rgbToAnsi256(r, g, b)}m`;
    case 16: {
      const base = rgbToAnsi8(r, g, b);
      return isBright(r, g, b)
        ? `\x1b[${base + 60}m`
        : `\x1b[${base}m`;
    }
    case 8:
      return `\x1b[${rgbToAnsi8(r, g, b)}m`;
  }
}

function bgEscape(
  rgb: [number, number, number],
  depth: 8 | 16 | 256 | 'truecolor',
): string {
  const [r, g, b] = rgb;
  switch (depth) {
    case 'truecolor':
      return `\x1b[48;2;${r};${g};${b}m`;
    case 256:
      return `\x1b[48;5;${rgbToAnsi256(r, g, b)}m`;
    case 16: {
      const base = rgbToAnsi8(r, g, b);
      // bg bright variants are base + 60, where base is already +10 from fg
      return isBright(r, g, b)
        ? `\x1b[${base + 70}m`
        : `\x1b[${base + 10}m`;
    }
    case 8:
      return `\x1b[${rgbToAnsi8(r, g, b) + 10}m`;
  }
}

export function formatAnsi(
  grid: CharacterGrid,
  colorDepth: 8 | 16 | 256 | 'truecolor',
): string {
  const lines: string[] = [];

  for (const row of grid) {
    let line = '';
    for (const cell of row) {
      const hasFg = cell.fg !== undefined;
      const hasBg = cell.bg !== undefined;

      if (!hasFg && !hasBg) {
        line += cell.char;
        continue;
      }

      let seq = '';
      if (hasBg) seq += bgEscape(cell.bg!, colorDepth);
      if (hasFg) seq += fgEscape(cell.fg!, colorDepth);
      seq += cell.char;
      seq += '\x1b[0m';
      line += seq;
    }
    lines.push(line);
  }

  return lines.join('\n');
}
