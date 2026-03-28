import { mapLuminanceToVariableType } from '../variable-type';

describe('mapLuminanceToVariableType', () => {
  const charset = ' .:-=+*#%@'; // 10 chars, dark to bright

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
    // With 10 chars, each band covers 255/9 ≈ 28.3 luminance values
    // Luminance 14 should be in the first band (char ' ') with mid-weight
    const grid = mapLuminanceToVariableType([[14]], charset, false);
    expect(grid[0][0].char).toBe(' ');
    // fraction ≈ 14/255*9 - 0 ≈ 0.494, weight ≈ 100 + round(0.494*8)*100 = 500
    expect(grid[0][0].weight).toBe(500);
  });

  it('inverts ramp when invertRamp is true', () => {
    // Black (0) with invert → treated as 255 → last char
    const grid = mapLuminanceToVariableType([[0]], charset, true);
    expect(grid[0][0].char).toBe('@');
    // At exact boundary (fraction=0), weight is minimum for that band
    expect(grid[0][0].weight).toBe(100);
  });

  it('white with invert maps to first character', () => {
    const grid = mapLuminanceToVariableType([[255]], charset, true);
    expect(grid[0][0].char).toBe(' ');
    expect(grid[0][0].weight).toBe(100);
  });

  it('handles a 2-character charset', () => {
    const grid = mapLuminanceToVariableType([[128]], '.#', false);
    // exactIdx = (128/255) * 1 ≈ 0.502 → charIdx=0, fraction≈0.502
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
    // Just verify chars differ for different luminance values
    expect(grid[0][0].char).toBe(' '); // darkest
    expect(grid[0][1].char).not.toBe(' '); // mid
    expect(grid[1][0].char).toBe('@'); // brightest
  });

  it('weight is always between 100 and 900', () => {
    // Test full range of luminance values
    const lumRow = Array.from({ length: 256 }, (_, i) => i);
    const grid = mapLuminanceToVariableType([lumRow], charset, false);
    for (const cell of grid[0]) {
      expect(cell.weight).toBeGreaterThanOrEqual(100);
      expect(cell.weight).toBeLessThanOrEqual(900);
      expect(cell.weight! % 100).toBe(0);
    }
  });

  it('produces monotonically increasing visual weight across luminance range', () => {
    // The combination of (charIndex, weight) should never decrease
    // as luminance increases, ensuring smooth gradation
    const lumRow = Array.from({ length: 256 }, (_, i) => i);
    const grid = mapLuminanceToVariableType([lumRow], charset, false);

    let prevCharIdx = 0;
    let prevWeight = 0;

    for (const cell of grid[0]) {
      const charIdx = charset.indexOf(cell.char);
      // char index should never decrease
      expect(charIdx).toBeGreaterThanOrEqual(prevCharIdx);
      // if same char, weight should not decrease
      if (charIdx === prevCharIdx) {
        expect(cell.weight).toBeGreaterThanOrEqual(prevWeight);
      }
      prevCharIdx = charIdx;
      prevWeight = cell.weight!;
    }
  });
});
