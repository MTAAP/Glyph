import { useRef, useEffect, useMemo, type RefObject } from 'react';
import { useAppStore } from '@/features/settings/store';
import { usePreviewScale, type ScaleMode } from '@/features/preview/hooks/usePreviewScale';
import type { CharacterGrid } from '@/shared/types';

const FONT_SIZE = 10;
const FONT_FAMILY = "'IBM Plex Mono', 'Courier New', monospace";

function measureCharDimensions(): { charWidth: number; charHeight: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  const metrics = ctx.measureText('M');
  const charWidth = metrics.width;
  const charHeight = FONT_SIZE * 1.1;
  return { charWidth, charHeight };
}

export function CanvasPreview({
  grid,
  containerRef,
  scaleMode = 'fit',
  customScale = 1,
}: {
  grid: CharacterGrid;
  containerRef: RefObject<HTMLDivElement | null>;
  scaleMode?: ScaleMode;
  customScale?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorMode = useAppStore((s) => s.settings.colorMode);
  const monoFgColor = useAppStore((s) => s.settings.monoFgColor);
  const cellSpacingX = useAppStore((s) => s.cellSpacingX);
  const cellSpacingY = useAppStore((s) => s.cellSpacingY);

  const { charWidth, charHeight } = useMemo(() => measureCharDimensions(), []);
  const cellPitchX = charWidth * cellSpacingX;
  const cellPitchY = charHeight * cellSpacingY;
  const contentWidth = grid[0]?.length ? grid[0].length * cellPitchX : 0;
  const contentHeight = grid.length * cellPitchY;

  const { scale } = usePreviewScale(containerRef, contentWidth, contentHeight, scaleMode, customScale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const cols = grid[0].length;
    const rows = grid.length;
    const width = Math.ceil(cols * cellPitchX);
    const height = Math.ceil(rows * cellPitchY);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'top';

    const bgGroups = new Map<string, { px: number; py: number }[]>();
    // Group foreground by color+weight for batched drawing
    const fgGroups = new Map<string, { char: string; px: number; py: number }[]>();

    for (let y = 0; y < rows; y++) {
      const row = grid[y];
      for (let x = 0; x < cols; x++) {
        const cell = row[x];
        const px = x * cellPitchX;
        const py = y * cellPitchY;

        // Group background rects by color
        if (cell.bg) {
          const colorStr = `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`;
          let list = bgGroups.get(colorStr);
          if (!list) {
            list = [];
            bgGroups.set(colorStr, list);
          }
          list.push({ px, py });
        }

        // Group foreground characters by color+weight (skip whitespace)
        if (cell.char !== ' ' && cell.char !== '') {
          let colorStr = '#e0e0e0';
          if (cell.fg) {
            colorStr = `rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})`;
          } else if (colorMode === 'mono') {
            colorStr = monoFgColor;
          }
          // Include weight in key for batching by font style
          const weight = cell.weight ?? 400;
          const key = `${colorStr}|${weight}`;
          let list = fgGroups.get(key);
          if (!list) {
            list = [];
            fgGroups.set(key, list);
          }
          list.push({ char: cell.char, px, py });
        }
      }
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw backgrounds in batches
    for (const [color, rects] of bgGroups.entries()) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (const { px, py } of rects) {
        ctx.rect(px, py, cellPitchX, cellPitchY);
      }
      ctx.fill();
    }

    // Draw foregrounds in batches (grouped by color+weight)
    for (const [key, items] of fgGroups.entries()) {
      const [color, weightStr] = key.split('|');
      const weight = parseInt(weightStr, 10);
      ctx.fillStyle = color;
      ctx.font = `${weight} ${FONT_SIZE}px ${FONT_FAMILY}`;
      for (const { char, px, py } of items) {
        ctx.fillText(char, px, py);
      }
    }

    // Reset font to default
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  }, [grid, cellPitchX, cellPitchY, colorMode, monoFgColor]);

  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  return (
    <div style={{ width: scaledWidth, height: scaledHeight, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
