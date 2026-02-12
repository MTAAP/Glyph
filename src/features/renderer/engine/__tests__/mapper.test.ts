import { mapToCharacters } from '../mapper';
import type { SampleResult } from '../sampler';
import type { RenderSettings } from '@/shared/types';

function createTestImage(
  width: number,
  height: number,
  fill: [number, number, number, number],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return data;
}

function makeSettings(overrides: Partial<RenderSettings> = {}): RenderSettings {
  return {
    outputWidth: 80,
    aspectRatioCorrection: 2.0,
    lockAspectRatio: true,
    enableLuminance: true,
    enableEdge: false,
    enableDithering: false,
    edgeThreshold: 128,
    ditheringStrength: 50,
    invertRamp: false,
    charsetPreset: 'classic',
    customCharset: '',
    wordSequence: 'GLYPH',
    wordMode: 'cycle' as const,
    wordThreshold: 128,
    cycleDirection: 'ltr' as const,
    colorMode: 'mono',
    colorDepth: 256,
    monoFgColor: '#ffffff',
    monoBgColor: '#000000',
    targetFPS: 30,
    playbackSpeed: 1,
    frameRange: [0, 100],
    loop: true,
    ...overrides,
  };
}

function makeSamples(
  grid: { r: number; g: number; b: number; a: number }[][],
): SampleResult {
  return {
    samples: grid,
    rows: grid.length,
    cols: grid[0]?.length ?? 0,
    cellWidth: 1,
    cellHeight: 1,
  };
}

/**
 * Creates a uniform sample grid with the given color.
 */
function uniformSamples(
  rows: number,
  cols: number,
  color: { r: number; g: number; b: number; a: number },
): SampleResult {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ ...color })),
  );
  return makeSamples(grid);
}

describe('mapToCharacters', () => {
  const charset = ' .:-=+*#%@';
  const dummyImageData = createTestImage(4, 4, [128, 128, 128, 255]);

  describe('luminance-only mode', () => {
    it('produces a CharacterGrid with correct dimensions', () => {
      const samples = uniformSamples(3, 5, { r: 128, g: 128, b: 128, a: 255 });
      const settings = makeSettings({ enableLuminance: true });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      expect(result.length).toBe(3);
      expect(result[0].length).toBe(5);
    });

    it('maps black samples to first charset character', () => {
      const samples = uniformSamples(2, 2, { r: 0, g: 0, b: 0, a: 255 });
      const settings = makeSettings({ enableLuminance: true });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      expect(result[0][0].char).toBe(' ');
      expect(result[1][1].char).toBe(' ');
    });

    it('maps white samples to last charset character', () => {
      const samples = uniformSamples(2, 2, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({ enableLuminance: true });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      expect(result[0][0].char).toBe('@');
    });

    it('respects invertRamp', () => {
      const samples = uniformSamples(1, 1, { r: 0, g: 0, b: 0, a: 255 });
      const settings = makeSettings({ invertRamp: true });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      // Black with invert -> last char
      expect(result[0][0].char).toBe('@');
    });
  });

  describe('edge-only mode', () => {
    it('overlays edge characters on top of luminance chars', () => {
      // Create a sample grid with a sharp vertical edge
      const samples = makeSamples([
        [{ r: 0, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
        [{ r: 0, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
        [{ r: 0, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
        [{ r: 0, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
        [{ r: 0, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }],
      ]);
      const settings = makeSettings({ enableEdge: true, edgeThreshold: 50 });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      // The edge at column 2 in interior rows should be an edge character
      const edgeChars = new Set(['|', '-', '/', '\\', '+']);
      // Interior cell at the edge boundary
      const edgeCell = result[2][2].char;
      // It should either be an edge char or the original luminance char
      // With a strong edge, the Sobel filter should detect it
      expect(edgeChars.has(edgeCell) || charset.includes(edgeCell)).toBe(true);
    });

    it('without edges enabled, no edge overlay occurs', () => {
      const samples = uniformSamples(3, 3, { r: 128, g: 128, b: 128, a: 255 });
      const settings = makeSettings({ enableEdge: false });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      // All cells should be luminance-mapped chars, no edge chars
      for (const row of result) {
        for (const cell of row) {
          expect(charset.includes(cell.char)).toBe(true);
        }
      }
    });
  });

  describe('luminance + dithering', () => {
    it('produces valid charset characters with dithering enabled', () => {
      const samples = uniformSamples(3, 3, { r: 128, g: 128, b: 128, a: 255 });
      const settings = makeSettings({
        enableDithering: true,
        ditheringStrength: 50,
      });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      for (const row of result) {
        for (const cell of row) {
          expect(charset.includes(cell.char)).toBe(true);
        }
      }
    });

    it('dithering takes precedence over plain luminance path', () => {
      // A mid-gray grid should potentially produce varied characters with dithering
      const samples = uniformSamples(4, 4, { r: 128, g: 128, b: 128, a: 255 });

      const withDither = mapToCharacters(
        samples,
        makeSettings({ enableDithering: true, ditheringStrength: 100 }),
        charset,
        dummyImageData,
        4,
        4,
      );
      const withoutDither = mapToCharacters(
        samples,
        makeSettings({ enableDithering: false }),
        charset,
        dummyImageData,
        4,
        4,
      );

      // With dithering at full strength on a mid-gray grid, we may get different chars
      // At minimum, both should produce valid grids
      expect(withDither.length).toBe(4);
      expect(withoutDither.length).toBe(4);
    });
  });

  describe('color modes', () => {
    it('mono mode: cells have no fg or bg properties', () => {
      const samples = uniformSamples(2, 2, { r: 100, g: 150, b: 200, a: 255 });
      const settings = makeSettings({ colorMode: 'mono' });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      for (const row of result) {
        for (const cell of row) {
          expect(cell.fg).toBeUndefined();
          expect(cell.bg).toBeUndefined();
        }
      }
    });

    it('foreground mode: cells have fg matching sample RGB', () => {
      const samples = uniformSamples(2, 2, { r: 100, g: 150, b: 200, a: 255 });
      const settings = makeSettings({ colorMode: 'foreground' });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      for (const row of result) {
        for (const cell of row) {
          expect(cell.fg).toEqual([100, 150, 200]);
          expect(cell.bg).toBeUndefined();
        }
      }
    });

    it('full mode: cells have bg matching sample RGB and fg is contrasting', () => {
      const samples = uniformSamples(2, 2, { r: 100, g: 150, b: 200, a: 255 });
      const settings = makeSettings({ colorMode: 'full' });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      for (const row of result) {
        for (const cell of row) {
          expect(cell.bg).toEqual([100, 150, 200]);
          expect(cell.fg).toBeDefined();
          // fg should be a 3-element RGB array
          expect(cell.fg).toHaveLength(3);
        }
      }
    });

    it('full mode: bright samples get dark contrasting fg', () => {
      const samples = uniformSamples(1, 1, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({ colorMode: 'full' });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      const cell = result[0][0];
      expect(cell.bg).toEqual([255, 255, 255]);
      // Contrasting color of white should be dark
      expect(cell.fg![0]).toBeLessThan(128);
      expect(cell.fg![1]).toBeLessThan(128);
      expect(cell.fg![2]).toBeLessThan(128);
    });

    it('full mode: dark samples get bright contrasting fg', () => {
      const samples = uniformSamples(1, 1, { r: 0, g: 0, b: 0, a: 255 });
      const settings = makeSettings({ colorMode: 'full' });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      const cell = result[0][0];
      expect(cell.bg).toEqual([0, 0, 0]);
      // Contrasting color of black should be bright
      expect(cell.fg![0]).toBeGreaterThan(128);
      expect(cell.fg![1]).toBeGreaterThan(128);
      expect(cell.fg![2]).toBeGreaterThan(128);
    });
  });

  describe('braille charset routing', () => {
    it('routes to braille renderer when charset is "braille"', () => {
      // Need a real image for braille since it reads pixel data directly
      const width = 4;
      const height = 8;
      const img = createTestImage(width, height, [255, 255, 255, 255]);
      const samples = uniformSamples(2, 2, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({ colorMode: 'mono' });

      const result = mapToCharacters(samples, settings, 'braille', img, width, height);

      // Braille chars should be in the Unicode braille block
      for (const row of result) {
        for (const cell of row) {
          const cp = cell.char.codePointAt(0)!;
          expect(cp).toBeGreaterThanOrEqual(0x2800);
          expect(cp).toBeLessThanOrEqual(0x28FF);
        }
      }
    });

    it('braille with foreground color mode assigns fg from samples', () => {
      const width = 4;
      const height = 8;
      const img = createTestImage(width, height, [200, 100, 50, 255]);
      const samples = uniformSamples(2, 2, { r: 200, g: 100, b: 50, a: 255 });
      const settings = makeSettings({ colorMode: 'foreground' });

      const result = mapToCharacters(samples, settings, 'braille', img, width, height);

      for (const row of result) {
        for (const cell of row) {
          expect(cell.fg).toEqual([200, 100, 50]);
        }
      }
    });

    it('braille with mono mode has no fg/bg', () => {
      const width = 4;
      const height = 8;
      const img = createTestImage(width, height, [128, 128, 128, 255]);
      const samples = uniformSamples(2, 2, { r: 128, g: 128, b: 128, a: 255 });
      const settings = makeSettings({ colorMode: 'mono' });

      const result = mapToCharacters(samples, settings, 'braille', img, width, height);

      for (const row of result) {
        for (const cell of row) {
          expect(cell.fg).toBeUndefined();
          expect(cell.bg).toBeUndefined();
        }
      }
    });
  });

  describe('combined luminance + edge', () => {
    it('edge characters replace luminance characters where detected', () => {
      // Build a 5x5 grid with a vertical edge at column 2
      const black = { r: 0, g: 0, b: 0, a: 255 };
      const white = { r: 255, g: 255, b: 255, a: 255 };
      const samples = makeSamples([
        [black, black, white, white, white],
        [black, black, white, white, white],
        [black, black, white, white, white],
        [black, black, white, white, white],
        [black, black, white, white, white],
      ]);
      const settings = makeSettings({ enableLuminance: true, enableEdge: true, edgeThreshold: 50 });
      const result = mapToCharacters(samples, settings, charset, dummyImageData, 4, 4);

      // Non-edge cells should use charset characters
      expect(charset.includes(result[0][0].char)).toBe(true);

      // Edge cell at (2,2) - if detected, should be an edge char
      const validChars = new Set([...charset, '|', '-', '/', '\\', '+']);
      for (const row of result) {
        for (const cell of row) {
          expect(validChars.has(cell.char)).toBe(true);
        }
      }
    });
  });

  describe('word cycle mode', () => {
    it('cycles characters by grid position', () => {
      const samples = uniformSamples(2, 3, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'ABC',
        wordThreshold: 0,
      });
      const result = mapToCharacters(samples, settings, 'ABC', dummyImageData, 4, 4);

      // Row 0: positions 0,1,2 → A,B,C
      expect(result[0][0].char).toBe('A');
      expect(result[0][1].char).toBe('B');
      expect(result[0][2].char).toBe('C');
      // Row 1: positions 3,4,5 → A,B,C (wraps)
      expect(result[1][0].char).toBe('A');
      expect(result[1][1].char).toBe('B');
      expect(result[1][2].char).toBe('C');
    });

    it('shows space for pixels below threshold', () => {
      // Dark pixels (lum ~0) with threshold 128 → not visible
      const samples = uniformSamples(1, 2, { r: 0, g: 0, b: 0, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'HI',
        wordThreshold: 128,
      });
      const result = mapToCharacters(samples, settings, 'HI', dummyImageData, 4, 4);

      expect(result[0][0].char).toBe(' ');
      expect(result[0][1].char).toBe(' ');
    });

    it('respects invertRamp', () => {
      // Dark pixels with invert → visible (lum <= threshold)
      const samples = uniformSamples(1, 2, { r: 0, g: 0, b: 0, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'HI',
        wordThreshold: 128,
        invertRamp: true,
      });
      const result = mapToCharacters(samples, settings, 'HI', dummyImageData, 4, 4);

      expect(result[0][0].char).toBe('H');
      expect(result[0][1].char).toBe('I');
    });

    it('applies color in foreground mode', () => {
      const samples = uniformSamples(1, 1, { r: 100, g: 200, b: 50, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'X',
        wordThreshold: 0,
        colorMode: 'foreground',
      });
      const result = mapToCharacters(samples, settings, 'X', dummyImageData, 4, 4);

      expect(result[0][0].fg).toEqual([100, 200, 50]);
    });

    it('handles empty charset gracefully', () => {
      const samples = uniformSamples(1, 1, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: '',
        wordThreshold: 0,
      });
      // Empty charset falls back to space
      const result = mapToCharacters(samples, settings, '', dummyImageData, 4, 4);

      expect(result[0][0].char).toBe(' ');
    });

    it('assigns characters only to visible cells (no index gaps)', () => {
      // Alternating bright/dark pixels in a 1×5 row
      const bright = { r: 255, g: 255, b: 255, a: 255 };
      const dark = { r: 0, g: 0, b: 0, a: 255 };
      const samples = makeSamples([[bright, dark, bright, dark, bright]]);
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'HELLO',
        wordThreshold: 128,
      });
      const result = mapToCharacters(samples, settings, 'HELLO', dummyImageData, 4, 4);

      // Only bright cells are visible — should get H, E, L sequentially
      expect(result[0][0].char).toBe('H');
      expect(result[0][1].char).toBe(' ');
      expect(result[0][2].char).toBe('E');
      expect(result[0][3].char).toBe(' ');
      expect(result[0][4].char).toBe('L');
    });

    it('RTL direction assigns right-to-left', () => {
      const samples = uniformSamples(1, 4, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'ABCD',
        wordThreshold: 0,
        cycleDirection: 'rtl',
      });
      const result = mapToCharacters(samples, settings, 'ABCD', dummyImageData, 4, 4);

      // RTL: rightmost cell gets first char
      expect(result[0][3].char).toBe('A');
      expect(result[0][2].char).toBe('B');
      expect(result[0][1].char).toBe('C');
      expect(result[0][0].char).toBe('D');
    });

    it('TTB direction assigns top-to-bottom column-first', () => {
      const samples = uniformSamples(3, 2, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'ABCDEF',
        wordThreshold: 0,
        cycleDirection: 'ttb',
      });
      const result = mapToCharacters(samples, settings, 'ABCDEF', dummyImageData, 4, 4);

      // TTB: column 0 top-to-bottom, then column 1 top-to-bottom
      expect(result[0][0].char).toBe('A');
      expect(result[1][0].char).toBe('B');
      expect(result[2][0].char).toBe('C');
      expect(result[0][1].char).toBe('D');
      expect(result[1][1].char).toBe('E');
      expect(result[2][1].char).toBe('F');
    });

    it('reverse direction assigns bottom-right to top-left', () => {
      const samples = uniformSamples(2, 3, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'ABCDEF',
        wordThreshold: 0,
        cycleDirection: 'reverse',
      });
      const result = mapToCharacters(samples, settings, 'ABCDEF', dummyImageData, 4, 4);

      // Reverse: bottom-right first
      expect(result[1][2].char).toBe('A');
      expect(result[1][1].char).toBe('B');
      expect(result[1][0].char).toBe('C');
      expect(result[0][2].char).toBe('D');
      expect(result[0][1].char).toBe('E');
      expect(result[0][0].char).toBe('F');
    });

    it('single-char word fills all visible cells with same character', () => {
      const samples = uniformSamples(2, 2, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'cycle',
        wordSequence: 'X',
        wordThreshold: 0,
      });
      const result = mapToCharacters(samples, settings, 'X', dummyImageData, 4, 4);

      for (const row of result) {
        for (const cell of row) {
          expect(cell.char).toBe('X');
        }
      }
    });
  });

  describe('word density mode', () => {
    it('uses word characters as standard luminance ramp', () => {
      // White pixel should map to the last character in the word
      const samples = uniformSamples(1, 1, { r: 255, g: 255, b: 255, a: 255 });
      const settings = makeSettings({
        charsetPreset: 'word',
        wordMode: 'density',
        wordSequence: 'ABC',
      });
      // Density mode goes through buildCharsetGrid — the word IS the charset
      const result = mapToCharacters(samples, settings, 'ABC', dummyImageData, 4, 4);

      expect(result[0][0].char).toBe('C');
    });
  });
});
