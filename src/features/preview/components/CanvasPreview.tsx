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
  const settings = useAppStore((s) => s.settings);
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

    // Clear
    ctx.clearRect(0, 0, width, height);

    for (let y = 0; y < rows; y++) {
      const row = grid[y];
      for (let x = 0; x < cols; x++) {
        const cell = row[x];
        const px = x * cellPitchX;
        const py = y * cellPitchY;

        // Background
        if (cell.bg) {
          ctx.fillStyle = `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`;
          ctx.fillRect(px, py, cellPitchX, cellPitchY);
        }

        // Foreground
        if (cell.fg) {
          ctx.fillStyle = `rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})`;
        } else if (settings.colorMode === 'mono') {
          ctx.fillStyle = settings.monoFgColor;
        } else {
          ctx.fillStyle = '#e0e0e0';
        }
        ctx.fillText(cell.char, px, py);
      }
    }
  }, [grid, cellPitchX, cellPitchY, settings.colorMode, settings.monoFgColor]);

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
