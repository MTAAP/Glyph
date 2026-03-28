import { useMemo, type RefObject } from 'react';
import { useAppStore } from '@/features/settings/store';
import { usePreviewScale, type ScaleMode } from '@/features/preview/hooks/usePreviewScale';
import type { CharacterGrid } from '@/shared/types';

const FONT_SIZE = 10;
const LINE_HEIGHT = 1.1;
const FONT_FAMILY = "'IBM Plex Mono', 'Courier New', monospace";
const PROPORTIONAL_FONT_FAMILY = "Georgia, 'Times New Roman', serif";

function measureCharWidth(): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
  return ctx.measureText('M').width;
}

function rgbStr(c: [number, number, number]): string {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Check if any cell in the grid has variable typographic properties. */
function gridHasTypography(grid: CharacterGrid): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.weight !== undefined || cell.italic || cell.opacity !== undefined) return true;
    }
  }
  return false;
}

function cellStyle(cell: { weight?: number; italic?: boolean; opacity?: number }): React.CSSProperties | undefined {
  const hasWeight = cell.weight !== undefined;
  const hasItalic = cell.italic;
  const hasOpacity = cell.opacity !== undefined;
  if (!hasWeight && !hasItalic && !hasOpacity) return undefined;
  return {
    fontWeight: cell.weight ?? undefined,
    fontStyle: cell.italic ? 'italic' : undefined,
    opacity: cell.opacity ?? undefined,
  };
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
  const isProportional = useAppStore((s) => s.settings.variableTypeProportional && s.settings.enableVariableType);
  const cellSpacingX = useAppStore((s) => s.cellSpacingX);
  const cellSpacingY = useAppStore((s) => s.cellSpacingY);

  const charWidth = useMemo(() => measureCharWidth(), []);
  const cols = grid[0]?.length ?? 0;
  const rows = grid.length;
  const contentWidth = cols * charWidth * cellSpacingX;
  const contentHeight = rows * FONT_SIZE * LINE_HEIGHT * cellSpacingY;

  const { scale } = usePreviewScale(containerRef, contentWidth, contentHeight, scaleMode, customScale);

  const fontFamily = isProportional ? PROPORTIONAL_FONT_FAMILY : FONT_FAMILY;

  const content = useMemo(() => {
    const spacingStyle: React.CSSProperties = {
      lineHeight: LINE_HEIGHT * cellSpacingY,
      letterSpacing: `${charWidth * (cellSpacingX - 1)}px`,
      fontFamily,
    };

    const hasTypography = gridHasTypography(grid);
    const preClass = isProportional
      ? 'whitespace-pre select-all'
      : 'font-mono whitespace-pre select-all';

    if (colorMode === 'mono' && !hasTypography) {
      return (
        <pre
          className={preClass}
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

    if (colorMode === 'mono') {
      return (
        <pre
          className={preClass}
          style={{
            fontSize: FONT_SIZE,
            ...spacingStyle,
            color: monoFgColor,
          }}
        >
          {grid.map((row, y) => (
            <div key={y}>
              {row.map((cell, x) => (
                <span key={x} style={cellStyle(cell)}>
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
          className={preClass}
          style={{ fontSize: FONT_SIZE, ...spacingStyle }}
        >
          {grid.map((row, y) => (
            <div key={y}>
              {row.map((cell, x) => (
                <span
                  key={x}
                  style={{
                    color: cell.fg ? rgbStr(cell.fg) : undefined,
                    ...cellStyle(cell),
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
        className={preClass}
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
                  ...cellStyle(cell),
                }}
              >
                {cell.char}
              </span>
            ))}
          </div>
        ))}
      </pre>
    );
  }, [grid, colorMode, monoFgColor, charWidth, cellSpacingX, cellSpacingY, fontFamily, isProportional]);

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
