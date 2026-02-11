import type { CharacterGrid, CharacterCell } from '@/shared/types/index.ts';

interface HtmlOptions {
  fontSize?: number;
  fontFamily?: string;
  background?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colorKey(cell: CharacterCell): string {
  const fg = cell.fg ? `${cell.fg[0]},${cell.fg[1]},${cell.fg[2]}` : '';
  const bg = cell.bg ? `${cell.bg[0]},${cell.bg[1]},${cell.bg[2]}` : '';
  return `${fg}|${bg}`;
}

function spanStyle(cell: CharacterCell): string {
  const parts: string[] = [];
  if (cell.fg) parts.push(`color:rgb(${cell.fg[0]},${cell.fg[1]},${cell.fg[2]})`);
  if (cell.bg)
    parts.push(`background-color:rgb(${cell.bg[0]},${cell.bg[1]},${cell.bg[2]})`);
  return parts.join(';');
}

export function formatHtml(
  grid: CharacterGrid,
  options: HtmlOptions = {},
): string {
  const fontSize = options.fontSize ?? 12;
  const fontFamily = options.fontFamily ?? 'monospace';
  const background = options.background ?? '#1a1a1a';

  const bodyLines: string[] = [];

  for (const row of grid) {
    let rowHtml = '';
    let i = 0;

    while (i < row.length) {
      const cell = row[i];
      const hasColor = cell.fg !== undefined || cell.bg !== undefined;

      if (!hasColor) {
        rowHtml += escapeHtml(cell.char);
        i++;
        continue;
      }

      // Batch consecutive cells with same color key
      const key = colorKey(cell);
      let batchChars = escapeHtml(cell.char);
      let j = i + 1;
      while (j < row.length && colorKey(row[j]) === key) {
        batchChars += escapeHtml(row[j].char);
        j++;
      }

      const style = spanStyle(cell);
      rowHtml += `<span style="${style}">${batchChars}</span>`;
      i = j;
    }

    bodyLines.push(rowHtml);
  }

  const preContent = bodyLines.join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Glyph Export</title>
<style>
  body {
    margin: 0;
    padding: 20px;
    background: ${background};
    display: flex;
    justify-content: center;
  }
  pre {
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    line-height: 1.2;
    margin: 0;
    white-space: pre;
  }
</style>
</head>
<body>
<pre>${preContent}</pre>
</body>
</html>`;
}
