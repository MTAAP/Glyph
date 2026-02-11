import type { CharacterGrid, CharacterCell, RenderSettings } from '@/shared/types';
import { contrastingColor } from '@/shared/utils/color';
import type { SampleResult } from './sampler';
import { computeLuminanceGrid, mapLuminanceToChars } from './luminance';
import { detectEdges } from './edge-detect';
import { applyDithering } from './dither';
import { renderBraille } from './braille';

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

  return buildCharsetGrid(samples, settings, charset);
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

  for (let y = 0; y < rows; y++) {
    const row = new Array<CharacterCell>(cols);

    for (let x = 0; x < cols; x++) {
      const lum = luminanceGrid[y][x];
      const visible = settings.invertRamp
        ? lum <= settings.wordThreshold
        : lum > settings.wordThreshold;

      const charIndex = (y * cols + x) % word.length;
      const char = visible ? word[charIndex] : ' ';
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
): CharacterGrid {
  const { rows, cols } = samples;
  const luminanceGrid = computeLuminanceGrid(samples.samples);

  // Determine character grid from luminance
  let charGrid: string[][];

  if (settings.enableDithering) {
    const dithered = applyDithering(
      luminanceGrid,
      charset.length,
      settings.ditheringStrength,
    );
    charGrid = mapLuminanceToChars(dithered, charset, settings.invertRamp);
  } else if (settings.enableLuminance) {
    charGrid = mapLuminanceToChars(luminanceGrid, charset, settings.invertRamp);
  } else {
    // Default to luminance mapping even if not explicitly enabled
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
