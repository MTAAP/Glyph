import { mapLuminanceToVariableType } from '../variable-type';

describe('mapLuminanceToVariableType', () => {
  const charset = ' .:-=+*#%@'; // 10 chars, dark to bright

  describe('weight only (default)', () => {
    it('maps black (0) to first character with minimum weight', () => {
      const grid = mapLuminanceToVariableType([[0]], charset, false);
      expect(grid[0][0].char).toBe(' ');
      expect(grid[0][0].weight).toBe(100);
    });

    it('maps white (255) to last character', () => {
      const grid = mapLuminanceToVariableType([[255]], charset, false);
      expect(grid[0][0].char).toBe('@');
      // At exact boundary (fraction=0), weight is minimum for that band
      expect(grid[0][0].weight).toBe(100);
    });

    it('assigns intermediate weight within a character band', () => {
      const grid = mapLuminanceToVariableType([[14]], charset, false);
      expect(grid[0][0].char).toBe(' ');
      // fraction ≈ 14/255*9 - 0 ≈ 0.494, weight ≈ 100 + round(0.494*8)*100 = 500
      expect(grid[0][0].weight).toBe(500);
    });

    it('inverts ramp when invertRamp is true', () => {
      const grid = mapLuminanceToVariableType([[0]], charset, true);
      expect(grid[0][0].char).toBe('@');
      expect(grid[0][0].weight).toBe(100);
    });

    it('white with invert maps to first character', () => {
      const grid = mapLuminanceToVariableType([[255]], charset, true);
      expect(grid[0][0].char).toBe(' ');
      expect(grid[0][0].weight).toBe(100);
    });

    it('handles a 2-character charset', () => {
      const grid = mapLuminanceToVariableType([[128]], '.#', false);
      expect(grid[0][0].char).toBe('.');
      expect(grid[0][0].weight).toBe(500);
    });

    it('handles multi-row grid', () => {
      const lumGrid = [
        [0, 128],
        [255, 64],
      ];
      const grid = mapLuminanceToVariableType(lumGrid, charset, false);
      expect(grid.length).toBe(2);
      expect(grid[0].length).toBe(2);
      expect(grid[1].length).toBe(2);
      expect(grid[0][0].char).toBe(' ');
      expect(grid[1][0].char).toBe('@');
    });

    it('weight is always between 100 and 900', () => {
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const grid = mapLuminanceToVariableType([lumRow], charset, false);
      for (const cell of grid[0]) {
        expect(cell.weight).toBeGreaterThanOrEqual(100);
        expect(cell.weight).toBeLessThanOrEqual(900);
        expect(cell.weight! % 100).toBe(0);
      }
    });

    it('produces monotonically increasing visual weight across luminance range', () => {
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const grid = mapLuminanceToVariableType([lumRow], charset, false);

      let prevCharIdx = 0;
      let prevWeight = 0;

      for (const cell of grid[0]) {
        const charIdx = charset.indexOf(cell.char);
        expect(charIdx).toBeGreaterThanOrEqual(prevCharIdx);
        if (charIdx === prevCharIdx) {
          expect(cell.weight).toBeGreaterThanOrEqual(prevWeight);
        }
        prevCharIdx = charIdx;
        prevWeight = cell.weight!;
      }
    });

    it('does not set italic or opacity by default', () => {
      const grid = mapLuminanceToVariableType([[128]], charset, false);
      expect(grid[0][0].italic).toBeUndefined();
      expect(grid[0][0].opacity).toBeUndefined();
    });
  });

  describe('italic mode', () => {
    const opts = { italic: true, opacity: false, proportional: false };

    it('assigns italic to higher fractions within a band', () => {
      // Full luminance range should include both italic and non-italic cells
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const grid = mapLuminanceToVariableType([lumRow], charset, false, opts);

      const hasItalic = grid[0].some((cell) => cell.italic === true);
      const hasNormal = grid[0].some((cell) => !cell.italic);
      expect(hasItalic).toBe(true);
      expect(hasNormal).toBe(true);
    });

    it('italic cells have valid weights', () => {
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const grid = mapLuminanceToVariableType([lumRow], charset, false, opts);
      for (const cell of grid[0]) {
        expect(cell.weight).toBeGreaterThanOrEqual(100);
        expect(cell.weight).toBeLessThanOrEqual(900);
      }
    });

    it('produces more effective levels than weight alone', () => {
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const gridWeight = mapLuminanceToVariableType([lumRow], charset, false);
      const gridItalic = mapLuminanceToVariableType([lumRow], charset, false, opts);

      // Count unique (char, weight, italic) combos
      const keysWeight = new Set(gridWeight[0].map((c) =>
        `${c.char}|${c.weight}`));
      const keysItalic = new Set(gridItalic[0].map((c) =>
        `${c.char}|${c.weight}|${c.italic}`));

      expect(keysItalic.size).toBeGreaterThan(keysWeight.size);
    });
  });

  describe('opacity mode', () => {
    const opts = { italic: false, opacity: true, proportional: false };

    it('assigns opacity values between 0.3 and 1.0', () => {
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const grid = mapLuminanceToVariableType([lumRow], charset, false, opts);
      for (const cell of grid[0]) {
        expect(cell.opacity).toBeDefined();
        expect(cell.opacity).toBeGreaterThanOrEqual(0.3);
        expect(cell.opacity).toBeLessThanOrEqual(1.0);
      }
    });

    it('provides opacity alongside weight', () => {
      const grid = mapLuminanceToVariableType([[128]], charset, false, opts);
      expect(grid[0][0].weight).toBeDefined();
      expect(grid[0][0].opacity).toBeDefined();
    });
  });

  describe('italic + opacity combined', () => {
    const opts = { italic: true, opacity: true, proportional: false };

    it('assigns all three properties', () => {
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const grid = mapLuminanceToVariableType([lumRow], charset, false, opts);

      const hasItalic = grid[0].some((c) => c.italic === true);
      const allHaveWeight = grid[0].every((c) => c.weight !== undefined);
      const allHaveOpacity = grid[0].every((c) => c.opacity !== undefined);

      expect(hasItalic).toBe(true);
      expect(allHaveWeight).toBe(true);
      expect(allHaveOpacity).toBe(true);
    });
  });

  describe('proportional mode', () => {
    const opts = { italic: false, opacity: false, proportional: true };

    it('selects characters with weight from the palette', () => {
      const grid = mapLuminanceToVariableType([[128]], charset, false, opts);
      expect(grid[0][0].char).toBeDefined();
      expect(charset).toContain(grid[0][0].char);
      expect(grid[0][0].weight).toBeDefined();
      // Proportional uses weights from palette: 300, 500, or 800
      expect([300, 500, 800]).toContain(grid[0][0].weight);
    });

    it('maps dark luminance to lower-brightness characters than bright luminance', () => {
      const gridDark = mapLuminanceToVariableType([[10]], charset, false, opts);
      const gridBright = mapLuminanceToVariableType([[245]], charset, false, opts);
      // Dark luminance should not select the heaviest characters
      expect(gridDark[0][0].char).not.toBe('@');
      // Dark and bright should differ
      const darkKey = `${gridDark[0][0].char}|${gridDark[0][0].weight}`;
      const brightKey = `${gridBright[0][0].char}|${gridBright[0][0].weight}`;
      expect(darkKey).not.toBe(brightKey);
    });

    it('maps bright luminance to high-brightness characters', () => {
      const grid = mapLuminanceToVariableType([[250]], charset, false, opts);
      // Should pick a dense character
      const brightChars = '#%@*';
      expect(brightChars).toContain(grid[0][0].char);
    });

    it('handles full grid', () => {
      const lumGrid = [
        [0, 128, 255],
        [64, 192, 32],
      ];
      const grid = mapLuminanceToVariableType(lumGrid, charset, false, opts);
      expect(grid.length).toBe(2);
      expect(grid[0].length).toBe(3);
      expect(grid[1].length).toBe(3);
    });

    it('with italic enabled, produces italic entries', () => {
      const optsItalic = { italic: true, opacity: false, proportional: true };
      const lumRow = Array.from({ length: 256 }, (_, i) => i);
      const grid = mapLuminanceToVariableType([lumRow], charset, false, optsItalic);
      const hasItalic = grid[0].some((c) => c.italic === true);
      expect(hasItalic).toBe(true);
    });

    it('with opacity enabled, adds opacity values', () => {
      const optsOpacity = { italic: false, opacity: true, proportional: true };
      const grid = mapLuminanceToVariableType([[128]], charset, false, optsOpacity);
      expect(grid[0][0].opacity).toBeDefined();
      expect(grid[0][0].opacity).toBeGreaterThanOrEqual(0.3);
      expect(grid[0][0].opacity).toBeLessThanOrEqual(1.0);
    });

    it('respects invertRamp', () => {
      const gridNormal = mapLuminanceToVariableType([[50]], charset, false, opts);
      const gridInvert = mapLuminanceToVariableType([[50]], charset, true, opts);
      // Inverted should pick a brighter character for the same luminance
      expect(gridInvert[0][0].char).not.toBe(gridNormal[0][0].char);
    });
  });
});
