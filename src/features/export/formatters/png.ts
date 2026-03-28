import type { CharacterGrid } from '@/shared/types/index.ts';

interface PngOptions {
  fontSize?: number;
  fontFamily?: string;
  background?: string | 'transparent';
  padding?: number;
  cellSpacingX?: number;
  cellSpacingY?: number;
}

export function formatPng(
  grid: CharacterGrid,
  options: PngOptions = {},
): Promise<Blob> {
  const fontSize = options.fontSize ?? 14;
  const fontFamily = options.fontFamily ?? 'monospace';
  const background = options.background ?? '#1a1a1a';
  const padding = options.padding ?? 10;
  const spX = options.cellSpacingX ?? 1.0;
  const spY = options.cellSpacingY ?? 1.0;

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const font = `${fontSize}px ${fontFamily}`;
  ctx.font = font;
  const metrics = ctx.measureText('M');
  const charWidth = metrics.width;
  const lineHeight = fontSize * 1.2;
  const cellPitchX = charWidth * spX;
  const cellPitchY = lineHeight * spY;

  canvas.width = Math.ceil(cols * cellPitchX + 2 * padding);
  canvas.height = Math.ceil(rows * cellPitchY + 2 * padding);

  // Reset font after resize (canvas resize clears state)
  ctx.font = font;
  ctx.textBaseline = 'top';

  if (background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  let currentFontStr = font;
  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    const y = padding + r * cellPitchY;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const x = padding + c * cellPitchX;

      if (cell.bg) {
        ctx.fillStyle = `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`;
        ctx.fillRect(x, y, cellPitchX, cellPitchY);
      }

      // Update font if weight or italic changed
      const weight = cell.weight ?? 400;
      const italicPrefix = cell.italic ? 'italic ' : '';
      const fontStr = `${italicPrefix}${weight} ${fontSize}px ${fontFamily}`;
      if (fontStr !== currentFontStr) {
        ctx.font = fontStr;
        currentFontStr = fontStr;
      }

      // Apply opacity
      if (cell.opacity !== undefined) {
        ctx.globalAlpha = cell.opacity;
      }

      if (cell.fg) {
        ctx.fillStyle = `rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})`;
      } else {
        ctx.fillStyle = '#e0e0e0';
      }
      ctx.fillText(cell.char, x, y);

      if (cell.opacity !== undefined) {
        ctx.globalAlpha = 1;
      }
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
  cellSpacingX = 1.0,
  cellSpacingY = 1.0,
): void {
  const cellPitchX = charWidth * cellSpacingX;
  const cellPitchY = lineHeight * cellSpacingY;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const rows = grid.length;
  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    const y = padding + r * cellPitchY;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const x = padding + c * cellPitchX;

      if (cell.bg) {
        ctx.fillStyle = `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`;
        ctx.fillRect(x, y, cellPitchX, cellPitchY);
      }

      if (cell.opacity !== undefined) {
        ctx.globalAlpha = cell.opacity;
      }

      if (cell.fg) {
        ctx.fillStyle = `rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})`;
      } else {
        ctx.fillStyle = '#e0e0e0';
      }
      ctx.fillText(cell.char, x, y);

      if (cell.opacity !== undefined) {
        ctx.globalAlpha = 1;
      }
    }
  }
}
