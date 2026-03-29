import { measureCharBrightness, measureCharsetPalette, clearPaletteCache } from '../font-measurer';

// Mock canvas context for deterministic testing
function createMockContext(pixelCoverage: number = 0.5): CanvasRenderingContext2D {
  const totalPixels = 28 * 28;
  const coveredPixels = Math.round(totalPixels * pixelCoverage);

  // Build mock image data: first `coveredPixels` have alpha=255, rest alpha=0
  const data = new Uint8ClampedArray(totalPixels * 4);
  for (let i = 0; i < coveredPixels; i++) {
    data[i * 4 + 3] = 255; // alpha channel
  }

  return {
    clearRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn(() => ({ data, width: 28, height: 28 })),
    measureText: vi.fn((char: string) => ({
      width: char === 'm' ? 18 : char === 'i' ? 6 : 12,
    })),
    font: '',
    textBaseline: '' as CanvasTextBaseline,
    textAlign: '' as CanvasTextAlign,
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D;
}

describe('measureCharBrightness', () => {
  it('returns 0 for a fully transparent character', () => {
    const ctx = createMockContext(0);
    const brightness = measureCharBrightness('x', 'Georgia', 400, false, ctx, 28);
    expect(brightness).toBe(0);
  });

  it('returns 1 for a fully covered character', () => {
    const ctx = createMockContext(1);
    const brightness = measureCharBrightness('x', 'Georgia', 400, false, ctx, 28);
    expect(brightness).toBe(1);
  });

  it('returns approximately 0.5 for half-covered character', () => {
    const ctx = createMockContext(0.5);
    const brightness = measureCharBrightness('x', 'Georgia', 400, false, ctx, 28);
    expect(brightness).toBeCloseTo(0.5, 1);
  });

  it('sets the correct font string for normal style', () => {
    const ctx = createMockContext(0.3);
    measureCharBrightness('A', 'Arial', 700, false, ctx, 28);
    expect(ctx.font).toBe('normal 700 22.400000000000002px Arial');
  });

  it('sets the correct font string for italic style', () => {
    const ctx = createMockContext(0.3);
    measureCharBrightness('A', 'Arial', 500, true, ctx, 28);
    expect(ctx.font).toBe('italic 500 22.400000000000002px Arial');
  });

  it('calls clearRect before measuring', () => {
    const ctx = createMockContext(0.3);
    measureCharBrightness('A', 'Arial', 400, false, ctx, 28);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 28, 28);
  });

  it('calls fillText with the character', () => {
    const ctx = createMockContext(0.3);
    measureCharBrightness('Z', 'Georgia', 400, false, ctx, 28);
    expect(ctx.fillText).toHaveBeenCalledWith('Z', 14, 14);
  });
});

describe('measureCharsetPalette', () => {
  // Mock document.createElement to return a canvas with our mock context
  let origCreateElement: typeof document.createElement;

  beforeEach(() => {
    clearPaletteCache();
    origCreateElement = document.createElement;

    document.createElement = vi.fn((tag: string) => {
      if (tag === 'canvas') {
        const mockCtx = createMockContext(0.3);
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => mockCtx),
        } as unknown as HTMLCanvasElement;
      }
      return origCreateElement.call(document, tag);
    });
  });

  afterEach(() => {
    document.createElement = origCreateElement;
  });

  it('returns entries for each char x weight x style combination', () => {
    const palette = measureCharsetPalette('ab', 'Georgia', false);
    // 2 chars x 3 weights x 1 style = 6 entries
    expect(palette.length).toBe(6);
  });

  it('returns more entries when italic is enabled', () => {
    const palette = measureCharsetPalette('ab', 'Georgia', true);
    // 2 chars x 3 weights x 2 styles = 12 entries
    expect(palette.length).toBe(12);
  });

  it('entries are sorted by brightness ascending', () => {
    const palette = measureCharsetPalette('abc', 'Georgia', true);
    for (let i = 1; i < palette.length; i++) {
      expect(palette[i].brightness).toBeGreaterThanOrEqual(palette[i - 1].brightness);
    }
  });

  it('each entry has required fields', () => {
    const palette = measureCharsetPalette('x', 'Georgia', false);
    for (const entry of palette) {
      expect(entry).toHaveProperty('char');
      expect(entry).toHaveProperty('weight');
      expect(entry).toHaveProperty('italic');
      expect(entry).toHaveProperty('brightness');
      expect(entry).toHaveProperty('width');
      expect(typeof entry.brightness).toBe('number');
      expect(typeof entry.width).toBe('number');
    }
  });

  it('caches results for the same font+charset', () => {
    const p1 = measureCharsetPalette('ab', 'Georgia', false);
    const p2 = measureCharsetPalette('ab', 'Georgia', false);
    expect(p1).toBe(p2); // Same reference = cached
  });

  it('returns different cache entries for different fonts', () => {
    const p1 = measureCharsetPalette('ab', 'Georgia', false);
    const p2 = measureCharsetPalette('ab', 'Arial', false);
    expect(p1).not.toBe(p2);
  });

  it('invalidates cache when requested', () => {
    const p1 = measureCharsetPalette('ab', 'Georgia', false);
    const p2 = measureCharsetPalette('ab', 'Georgia', false, true);
    expect(p1).not.toBe(p2); // Different reference = remeasured
  });

  it('weights are from the expected set [300, 500, 800]', () => {
    const palette = measureCharsetPalette('abc', 'Georgia', false);
    for (const entry of palette) {
      expect([300, 500, 800]).toContain(entry.weight);
    }
  });

  it('returns empty palette when canvas context is unavailable', () => {
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => null),
        } as unknown as HTMLCanvasElement;
      }
      return origCreateElement.call(document, tag);
    });

    const palette = measureCharsetPalette('ab', 'Georgia', false);
    expect(palette.length).toBe(0);
  });
});
