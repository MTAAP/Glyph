import type { CharacterGrid } from '@/shared/types/index.ts';

interface SvgOptions {
  fontSize?: number;
  fontFamily?: string;
  background?: string | 'transparent';
  cellSpacingX?: number;
  cellSpacingY?: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSvgText(
  styleKey: string,
  startX: number,
  y: number,
  charWidth: number,
  charHeight: number,
  textBaselineOffset: number,
  text: string,
): string {
  const [color, weightStr, italicStr, opacityStr] = styleKey.split('|');
  const attrs: string[] = [];
  attrs.push(`x="${(startX * charWidth).toFixed(1)}"`);
  attrs.push(`y="${((y * charHeight) + textBaselineOffset).toFixed(1)}"`);
  attrs.push(`fill="${color}"`);
  if (weightStr !== '400') attrs.push(`font-weight="${weightStr}"`);
  if (italicStr === 'i') attrs.push('font-style="italic"');
  if (opacityStr !== '1') attrs.push(`opacity="${opacityStr}"`);
  attrs.push('xml:space="preserve"');
  return `<text ${attrs.join(' ')}>${escapeXml(text)}</text>\n`;
}

export function formatSvg(
  grid: CharacterGrid,
  options: SvgOptions = {},
): string {
  const fontSize = options.fontSize ?? 14;
  const fontFamily = options.fontFamily ?? 'monospace';
  const background = options.background ?? '#1a1a1a';
  const spX = options.cellSpacingX ?? 1.0;
  const spY = options.cellSpacingY ?? 1.0;

  // Approximate character metrics
  const charWidth = fontSize * 0.6 * spX;
  const charHeight = fontSize * 1.2 * spY;
  
  const cols = grid[0]?.length ?? 0;
  const rows = grid.length;
  
  const width = cols * charWidth;
  const height = rows * charHeight;

  let svgContent = '';

  // Backgrounds
  for (let y = 0; y < rows; y++) {
    const row = grid[y];
    let startX = -1;
    let currentColor: string | null = null;
    let currentLength = 0;

    for (let x = 0; x < cols; x++) {
      const cell = row[x];
      const bgColor = cell.bg ? `rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})` : null;

      if (bgColor !== currentColor) {
        if (currentColor !== null && startX !== -1) {
          svgContent += `<rect x="${(startX * charWidth).toFixed(1)}" y="${(y * charHeight).toFixed(1)}" width="${(currentLength * charWidth).toFixed(1)}" height="${charHeight.toFixed(1)}" fill="${currentColor}" />\n`;
        }
        currentColor = bgColor;
        startX = x;
        currentLength = 1;
      } else {
        currentLength++;
      }
    }
    
    if (currentColor !== null && startX !== -1) {
      svgContent += `<rect x="${(startX * charWidth).toFixed(1)}" y="${(y * charHeight).toFixed(1)}" width="${(currentLength * charWidth).toFixed(1)}" height="${charHeight.toFixed(1)}" fill="${currentColor}" />\n`;
    }
  }

  // Foregrounds
  // SVG text rendering baseline is bottom, we need to adjust Y
  const textBaselineOffset = charHeight * 0.75;
  
  for (let y = 0; y < rows; y++) {
    const row = grid[y];
    let startX = -1;
    let currentColor: string | null = null;
    let currentText = '';

    for (let x = 0; x < cols; x++) {
      const cell = row[x];
      const fgColor = cell.fg ? `rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})` : '#e0e0e0';
      const weight = cell.weight ?? 400;
      const italic = cell.italic ? 'i' : 'n';
      const opacity = cell.opacity !== undefined ? cell.opacity.toFixed(2) : '1';
      const styleKey = `${fgColor}|${weight}|${italic}|${opacity}`;

      if (styleKey !== currentColor) {
        if (currentColor !== null && startX !== -1 && currentText.trim() !== '') {
          svgContent += buildSvgText(currentColor, startX, y, charWidth, charHeight, textBaselineOffset, currentText);
        }
        currentColor = styleKey;
        startX = x;
        currentText = cell.char;
      } else {
        currentText += cell.char;
      }
    }

    if (currentColor !== null && startX !== -1 && currentText.trim() !== '') {
      svgContent += buildSvgText(currentColor, startX, y, charWidth, charHeight, textBaselineOffset, currentText);
    }
  }

  const bgRect = background !== 'transparent' 
    ? `<rect width="100%" height="100%" fill="${background}" />` 
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}">
  <style>
    text {
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      letter-spacing: ${(fontSize * 0.6 * (spX - 1)).toFixed(2)}px;
    }
  </style>
  ${bgRect}
  ${svgContent}
</svg>`;
}
