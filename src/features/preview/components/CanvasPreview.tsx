import { useRef, useEffect, useMemo, type RefObject } from 'react';
import { useAppStore } from '@/features/settings/store';
import { usePreviewScale } from '@/features/preview/hooks/usePreviewScale';
import type { CharacterGrid } from '@/shared/types';

const FONT_SIZE = 12;
const FONT_FAMILY = 'monospace';

function measureCharDimensions(): { charWidth: number; charHeight: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  const metrics = ctx.measureText('M');
  const charWidth = metrics.width;
  const charHeight = FONT_SIZE * 1.2;
  return { charWidth, charHeight };
}

export function CanvasPreview({
  grid,
  containerRef,
}: {
  grid: CharacterGrid;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useAppStore((s) => s.settings);

  const { charWidth, charHeight } = useMemo(() => measureCharDimensions(), []);
  const contentWidth = grid[0]?.length ? grid[0].length * charWidth : 0;
  const contentHeight = grid.length * charHeight;

  const { scale } = usePreviewScale(containerRef, contentWidth, contentHeight);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;

    const cols = grid[0].length;
    const rows = grid.length;
    const width = Math.ceil(cols * charWidth);
    const height = Math.ceil(rows * charHeight);

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
        const px = x * charWidth;
        const py = y * charHeight;

        // Background
        if (cell.bg) {
          ctx.fillStyle = `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`;
          ctx.fillRect(px, py, charWidth, charHeight);
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
  }, [grid, charWidth, charHeight, settings.colorMode, settings.monoFgColor]);

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
