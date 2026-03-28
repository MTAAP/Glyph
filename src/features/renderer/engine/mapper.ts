import type { CharacterGrid, CharacterCell, RenderSettings, CycleDirection, MeasuredPalette } from '@/shared/types';
import { contrastingColor } from '@/shared/utils/color';
import type { SampleResult } from './sampler';
import { computeLuminanceGrid, mapLuminanceToChars } from './luminance';
import { detectEdges } from './edge-detect';
import { applyDithering } from './dither';
import { renderBraille } from './braille';
import { mapLuminanceToVariableType, type VariableTypeOptions } from './variable-type';

/**
 * Main character mapping orchestrator.
 *
 * Routes rendering through the appropriate pipeline based on settings:
 * - Braille mode uses a dedicated sub-pixel encoder
 * - Otherwise computes luminance, applies optional dithering, maps to chars,
 *   and overlays optional edge detection
 *
 * Color modes:
 *   mono       - no per-cell fg/bg; caller applies global mono colors
 *   foreground - fg = sampled pixel RGB
 *   full       - bg = sampled pixel RGB, fg = contrasting color
 */
export function mapToCharacters(
  samples: SampleResult,
  settings: RenderSettings,
  charset: string,
  imageData: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  measuredPalette?: MeasuredPalette,
): CharacterGrid {
  // Braille path -- bypasses luminance/charset pipeline entirely
  if (charset === 'braille') {
    return buildBrailleGrid(
      imageData,
      sourceWidth,
      sourceHeight,
      samples,
      settings,
    );
  }

  // Word cycle mode -- tiles characters by grid position with threshold masking
  if (settings.charsetPreset === 'word' && settings.wordMode === 'cycle') {
    return buildWordCycleGrid(samples, settings, charset);
  }

  return buildCharsetGrid(samples, settings, charset, measuredPalette);
}

/**
 * Returns visible cell coordinates in the specified traversal order.
 */
function getDirectionalCoords(
  visibleGrid: boolean[][],
  rows: number,
  cols: number,
  direction: CycleDirection,
): [number, number][] {
  const coords: [number, number][] = [];

  switch (direction) {
    case 'rtl':
      for (let y = 0; y < rows; y++)
        for (let x = cols - 1; x >= 0; x--)
          if (visibleGrid[y][x]) coords.push([y, x]);
      break;
    case 'ttb':
      for (let x = 0; x < cols; x++)
        for (let y = 0; y < rows; y++)
          if (visibleGrid[y][x]) coords.push([y, x]);
      break;
    case 'reverse':
      for (let y = rows - 1; y >= 0; y--)
        for (let x = cols - 1; x >= 0; x--)
          if (visibleGrid[y][x]) coords.push([y, x]);
      break;
    default: // 'ltr'
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
          if (visibleGrid[y][x]) coords.push([y, x]);
      break;
  }

  return coords;
}

function buildWordCycleGrid(
  samples: SampleResult,
  settings: RenderSettings,
  charset: string,
): CharacterGrid {
  const { rows, cols } = samples;
  const luminanceGrid = computeLuminanceGrid(samples.samples);
  const word = charset.length > 0 ? charset : ' ';
  const grid: CharacterGrid = new Array(rows);

  // Pass 1: compute visibility + initialize all cells as spaces
  const visibleGrid: boolean[][] = new Array(rows);
  for (let y = 0; y < rows; y++) {
    const row = new Array<CharacterCell>(cols);
    visibleGrid[y] = new Array<boolean>(cols);

    for (let x = 0; x < cols; x++) {
      const lum = luminanceGrid[y][x];
      visibleGrid[y][x] = settings.invertRamp
        ? lum <= settings.wordThreshold
        : lum > settings.wordThreshold;

      const cell: CharacterCell = { char: ' ' };
      if (settings.colorMode !== 'mono') {
        const sample = samples.samples[y][x];
        applyColor(cell, sample.r, sample.g, sample.b, settings.colorMode);
      }
      row[x] = cell;
    }

    grid[y] = row;
  }

  // Pass 2: assign characters sequentially to visible cells in traversal order
  const coords = getDirectionalCoords(visibleGrid, rows, cols, settings.cycleDirection);
  for (let i = 0; i < coords.length; i++) {
    const [y, x] = coords[i];
    grid[y][x].char = word[i % word.length];
  }

  return grid;
}

function buildBrailleGrid(
  imageData: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  samples: SampleResult,
  settings: RenderSettings,
): CharacterGrid {
  const { grid: brailleChars, rows, cols } = renderBraille(
    imageData,
    sourceWidth,
    sourceHeight,
    samples.cols,
    settings.invertRamp,
  );

  const grid: CharacterGrid = new Array(rows);

  for (let y = 0; y < rows; y++) {
    const row = new Array<CharacterCell>(cols);

    for (let x = 0; x < cols; x++) {
      const cell: CharacterCell = { char: brailleChars[y][x] };

      // Use samples for color when available (braille grid may differ in row count)
      if (settings.colorMode !== 'mono' && y < samples.rows && x < samples.cols) {
        const sample = samples.samples[y][x];
        applyColor(cell, sample.r, sample.g, sample.b, settings.colorMode);
      }

      row[x] = cell;
    }

    grid[y] = row;
  }

  return grid;
}

function buildCharsetGrid(
  samples: SampleResult,
  settings: RenderSettings,
  charset: string,
  measuredPalette?: MeasuredPalette,
): CharacterGrid {
  const { rows, cols } = samples;
  const luminanceGrid = computeLuminanceGrid(samples.samples);

  // Variable typography path: character + font weight from luminance
  if (settings.enableVariableType) {
    return buildVariableTypeGrid(samples, settings, charset, luminanceGrid, measuredPalette);
  }

  // Determine character grid from luminance
  let charGrid: string[][];

  if (settings.enableDithering) {
    const dithered = applyDithering(
      luminanceGrid,
      charset.length,
      settings.ditheringStrength,
    );
    charGrid = mapLuminanceToChars(dithered, charset, settings.invertRamp);
  } else {
    charGrid = mapLuminanceToChars(luminanceGrid, charset, settings.invertRamp);
  }

  // Overlay edge detection characters where detected
  let edgeGrid: (string | null)[][] | null = null;
  if (settings.enableEdge) {
    edgeGrid = detectEdges(luminanceGrid, settings.edgeThreshold);
  }

  // Assemble final character grid with color
  const grid: CharacterGrid = new Array(rows);

  for (let y = 0; y < rows; y++) {
    const row = new Array<CharacterCell>(cols);

    for (let x = 0; x < cols; x++) {
      const edgeChar = edgeGrid?.[y]?.[x];
      const char = edgeChar ?? charGrid[y][x];
      const cell: CharacterCell = { char };

      if (settings.colorMode !== 'mono') {
        const sample = samples.samples[y][x];
        applyColor(cell, sample.r, sample.g, sample.b, settings.colorMode);
      }

      row[x] = cell;
    }

    grid[y] = row;
  }

  return grid;
}

function buildVariableTypeGrid(
  samples: SampleResult,
  settings: RenderSettings,
  charset: string,
  luminanceGrid: number[][],
  measuredPalette?: MeasuredPalette,
): CharacterGrid {
  const { rows, cols } = samples;

  // Apply dithering to luminance if enabled, then map with variable type
  let lumGrid = luminanceGrid;
  if (settings.enableDithering) {
    lumGrid = applyDithering(lumGrid, charset.length, settings.ditheringStrength);
  }

  const varOptions: VariableTypeOptions = {
    italic: settings.variableTypeItalic,
    opacity: settings.variableTypeOpacity,
    proportional: settings.variableTypeProportional,
  };
  const varGrid = mapLuminanceToVariableType(lumGrid, charset, settings.invertRamp, varOptions, measuredPalette);

  // Overlay edge detection and apply color
  let edgeGrid: (string | null)[][] | null = null;
  if (settings.enableEdge) {
    edgeGrid = detectEdges(luminanceGrid, settings.edgeThreshold);
  }

  const grid: CharacterGrid = new Array(rows);

  for (let y = 0; y < rows; y++) {
    const row = new Array<CharacterCell>(cols);

    for (let x = 0; x < cols; x++) {
      const edgeChar = edgeGrid?.[y]?.[x];
      const cell = varGrid[y][x];

      if (edgeChar) {
        cell.char = edgeChar;
        cell.weight = undefined;
        cell.italic = undefined;
        cell.opacity = undefined;
      }

      if (settings.colorMode !== 'mono') {
        const sample = samples.samples[y][x];
        applyColor(cell, sample.r, sample.g, sample.b, settings.colorMode);
      }

      row[x] = cell;
    }

    grid[y] = row;
  }

  return grid;
}

function applyColor(
  cell: CharacterCell,
  r: number,
  g: number,
  b: number,
  colorMode: 'foreground' | 'full',
): void {
  if (colorMode === 'foreground') {
    cell.fg = [r, g, b];
  } else {
    // full: bg = sampled color, fg = contrasting
    cell.bg = [r, g, b];
    cell.fg = contrastingColor(r, g, b);
  }
}
