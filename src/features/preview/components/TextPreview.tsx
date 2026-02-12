import { useMemo, type RefObject } from 'react';
import { useAppStore } from '@/features/settings/store';
import { usePreviewScale } from '@/features/preview/hooks/usePreviewScale';
import type { CharacterGrid } from '@/shared/types';

const FONT_SIZE = 10;
const LINE_HEIGHT = 1.1;
const FONT_FAMILY = 'monospace';

function measureCharWidth(): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  return ctx.measureText('M').width;
}

function rgbStr(c: [number, number, number]): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function TextPreview({
  grid,
  containerRef,
}: {
  grid: CharacterGrid;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const settings = useAppStore((s) => s.settings);
  const cellSpacingX = useAppStore((s) => s.cellSpacingX);
  const cellSpacingY = useAppStore((s) => s.cellSpacingY);

  const charWidth = useMemo(() => measureCharWidth(), []);
  const cols = grid[0]?.length ?? 0;
  const rows = grid.length;
  const contentWidth = cols * charWidth * cellSpacingX;
  const contentHeight = rows * FONT_SIZE * LINE_HEIGHT * cellSpacingY;

  const { scale } = usePreviewScale(containerRef, contentWidth, contentHeight);

  const content = useMemo(() => {
    const spacingStyle = {
      lineHeight: LINE_HEIGHT * cellSpacingY,
      letterSpacing: `${charWidth * (cellSpacingX - 1)}px`,
    };

    if (settings.colorMode === 'mono') {
      return (
        <pre
          className="font-mono whitespace-pre select-all"
          style={{
            fontSize: FONT_SIZE,
            ...spacingStyle,
            color: settings.monoFgColor,
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

    if (settings.colorMode === 'foreground') {
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
                }}
              >
                {cell.char}
              </span>
            ))}
          </div>
        ))}
      </pre>
    );
  }, [grid, settings.colorMode, settings.monoFgColor, charWidth, cellSpacingX, cellSpacingY]);

  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;

  const bgColor = settings.colorMode === 'mono' ? settings.monoBgColor : undefined;

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
