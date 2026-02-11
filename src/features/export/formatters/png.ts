import type { CharacterGrid } from '@/shared/types/index.ts';

interface PngOptions {
  fontSize?: number;
  fontFamily?: string;
  background?: string | 'transparent';
  padding?: number;
}

export function formatPng(
  grid: CharacterGrid,
  options: PngOptions = {},
): Promise<Blob> {
  const fontSize = options.fontSize ?? 14;
  const fontFamily = options.fontFamily ?? 'monospace';
  const background = options.background ?? '#1a1a1a';
  const padding = options.padding ?? 10;

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const font = `${fontSize}px ${fontFamily}`;
  ctx.font = font;
  const metrics = ctx.measureText('M');
  const charWidth = metrics.width;
  const lineHeight = fontSize * 1.2;

  canvas.width = Math.ceil(cols * charWidth + 2 * padding);
  canvas.height = Math.ceil(rows * lineHeight + 2 * padding);

  // Reset font after resize (canvas resize clears state)
  ctx.font = font;
  ctx.textBaseline = 'top';

  if (background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    const y = padding + r * lineHeight;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const x = padding + c * charWidth;

      if (cell.bg) {
        ctx.fillStyle = `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`;
        ctx.fillRect(x, y, charWidth, lineHeight);
      }

      if (cell.fg) {
        ctx.fillStyle = `rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})`;
      } else {
        ctx.fillStyle = '#e0e0e0';
      }
      ctx.fillText(cell.char, x, y);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/png',
    );
  });
}

/** Render a grid to canvas and return its ImageData (used by gif/webm formatters). */
export function renderGridToCanvas(
  grid: CharacterGrid,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  charWidth: number,
  lineHeight: number,
  padding: number,
  background: string | 'transparent',
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const rows = grid.length;
  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    const y = padding + r * lineHeight;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const x = padding + c * charWidth;

      if (cell.bg) {
        ctx.fillStyle = `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`;
        ctx.fillRect(x, y, charWidth, lineHeight);
      }

      if (cell.fg) {
        ctx.fillStyle = `rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})`;
      } else {
        ctx.fillStyle = '#e0e0e0';
      }
      ctx.fillText(cell.char, x, y);
    }
  }
}
