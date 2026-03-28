import { useMemo, type RefObject } from 'react';
import { useAppStore } from '@/features/settings/store';
import { usePreviewScale, type ScaleMode } from '@/features/preview/hooks/usePreviewScale';
import type { CharacterGrid } from '@/shared/types';

const FONT_SIZE = 10;
const LINE_HEIGHT = 1.1;
const FONT_FAMILY = "'IBM Plex Mono', 'Courier New', monospace";

function measureCharWidth(): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  return ctx.measureText('M').width;
}

function rgbStr(c: [number, number, number]): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Check if any cell in the grid has a non-default weight. */
function gridHasWeights(grid: CharacterGrid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.weight !== undefined) return true;
    }
  }
  return false;
}

export function TextPreview({
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
  const colorMode = useAppStore((s) => s.settings.colorMode);
  const monoFgColor = useAppStore((s) => s.settings.monoFgColor);
  const monoBgColor = useAppStore((s) => s.settings.monoBgColor);
  const cellSpacingX = useAppStore((s) => s.cellSpacingX);
  const cellSpacingY = useAppStore((s) => s.cellSpacingY);

  const charWidth = useMemo(() => measureCharWidth(), []);
  const cols = grid[0]?.length ?? 0;
  const rows = grid.length;
  const contentWidth = cols * charWidth * cellSpacingX;
  const contentHeight = rows * FONT_SIZE * LINE_HEIGHT * cellSpacingY;

  const { scale } = usePreviewScale(containerRef, contentWidth, contentHeight, scaleMode, customScale);

  const content = useMemo(() => {
    const spacingStyle = {
      lineHeight: LINE_HEIGHT * cellSpacingY,
      letterSpacing: `${charWidth * (cellSpacingX - 1)}px`,
    };

    const hasWeights = gridHasWeights(grid);

    if (colorMode === 'mono' && !hasWeights) {
      return (
        <pre
          className="font-mono whitespace-pre select-all"
          style={{
            fontSize: FONT_SIZE,
            ...spacingStyle,
            color: monoFgColor,
          }}
        >
          {grid.map((row, y) => (
            <div key={y}>
              {row.map((cell) => cell.char).join('')}
            </div>
          ))}
        </pre>
      );
    }

    if (colorMode === 'mono' && hasWeights) {
      return (
        <pre
          className="font-mono whitespace-pre select-all"
          style={{
            fontSize: FONT_SIZE,
            ...spacingStyle,
            color: monoFgColor,
          }}
        >
          {grid.map((row, y) => (
            <div key={y}>
              {row.map((cell, x) => (
                <span
                  key={x}
                  style={{
                    fontWeight: cell.weight ?? undefined,
                  }}
                >
                  {cell.char}
                </span>
              ))}
            </div>
          ))}
        </pre>
      );
    }

    if (colorMode === 'foreground') {
      return (
        <pre
          className="font-mono whitespace-pre select-all"
          style={{ fontSize: FONT_SIZE, ...spacingStyle }}
        >
          {grid.map((row, y) => (
            <div key={y}>
              {row.map((cell, x) => (
                <span
                  key={x}
                  style={{
                    color: cell.fg ? rgbStr(cell.fg) : undefined,
                    fontWeight: cell.weight ?? undefined,
                  }}
                >
                  {cell.char}
                </span>
              ))}
            </div>
          ))}
        </pre>
      );
    }

    // Full color mode
    return (
      <pre
        className="font-mono whitespace-pre select-all"
        style={{ fontSize: FONT_SIZE, ...spacingStyle }}
      >
        {grid.map((row, y) => (
          <div key={y}>
            {row.map((cell, x) => (
              <span
                key={x}
                style={{
                  color: cell.fg ? rgbStr(cell.fg) : undefined,
                  backgroundColor: cell.bg ? rgbStr(cell.bg) : undefined,
                  fontWeight: cell.weight ?? undefined,
                }}
              >
                {cell.char}
              </span>
            ))}
          </div>
        ))}
      </pre>
    );
  }, [grid, colorMode, monoFgColor, charWidth, cellSpacingX, cellSpacingY]);

  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  const bgColor = colorMode === 'mono' ? monoBgColor : undefined;

  return (
    <div style={{ width: scaledWidth, height: scaledHeight, overflow: 'hidden', backgroundColor: bgColor }}>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {content}
      </div>
    </div>
  );
}
