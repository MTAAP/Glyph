import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext, RGB } from '../types';
import { registerEffect } from '../registry';
import { seededRandom, blendColor, brightenRgb, dimRgb } from '../utils';

// Deep crimson palette — dark reds, hot crimson, near-black, with occasional cyan/white accents
const WALL_DARK: RGB = [40, 0, 0];
const WALL_RED: RGB = [180, 0, 20];
const WALL_CRIMSON: RGB = [255, 0, 50];
const WALL_HOT: RGB = [255, 40, 0];
const ACCENT_CYAN: RGB = [0, 200, 220];
const ACCENT_WHITE: RGB = [255, 220, 220];

/**
 * Heartbeat pulse — double-pump with pause, mimicking an organic rhythm.
 * Returns 0..1 where peaks are the two beats.
 */
function heartbeat(t: number): number {
  // Two sharp peaks at ~0.0 and ~0.15 in the cycle, then long rest
  const p = t % 1;
  const d1 = (p - 0.0) * 8;
  const beat1 = Math.exp(-(d1 * d1));
  const d2 = (p - 0.18) * 10;
  const beat2 = Math.exp(-(d2 * d2)) * 0.7;
  return Math.min(1, beat1 + beat2);
}

/**
 * Vertical drip streaks — per-column drip heads that flow downward.
 * Returns drip brightness 0..1 for a cell at (x, y).
 */
function dripStreak(
  x: number, y: number, ctx: AnimationContext,
  speed: number, density: number,
): number {
  // Each column has a seeded chance of hosting a drip
  const colSeed = x * 997 + 31;
  if (seededRandom(colSeed) > density) return 0;

  const trailLength = 6 + Math.floor(seededRandom(colSeed + 7) * 10);
  const dripSpeed = 0.6 + seededRandom(colSeed + 13) * 0.8;
  const offset = seededRandom(colSeed + 19) * ctx.rows;
  const headY = ((ctx.t * speed * dripSpeed * ctx.rows + offset) % (ctx.rows + trailLength)) - trailLength;
  const dist = y - headY;

  if (dist < 0 || dist > trailLength) return 0;
  if (dist < 1) return 1; // bright head
  return Math.max(0, 1 - dist / trailLength); // fading trail
}

/**
 * Macro-block corruption — returns true if a cell is inside a corrupted block.
 * Simulates MPEG macro-block artifacts.
 */
function inMacroBlock(
  x: number, y: number, frame: number, corruption: number,
): boolean {
  // Divide grid into 4x3 blocks, seeded per frame
  const blockX = Math.floor(x / 4);
  const blockY = Math.floor(y / 3);
  const blockSeed = frame * 137 + blockX * 53 + blockY * 29;
  return seededRandom(blockSeed) < corruption;
}

function applyBlackwall(
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
): CharacterGrid {
  const intensity = params.intensity;
  const corruption = params.corruption;
  const speed = params.speed;
  const dripDensity = params.dripDensity;

  // Heartbeat pulse — organic double-pump rhythm
  const pulse = heartbeat(ctx.t * speed);

  // Slower background breathing for the interference waves
  const breathe = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ctx.t * speed * Math.PI * 2));

  const baseSeed = ctx.frame * 1000;

  return grid.map((row, y) =>
    row.map((cell, x) => {
      const baseFg: RGB = cell.fg ?? [200, 200, 200];
      let char = cell.char;

      const nx = ctx.cols > 1 ? x / (ctx.cols - 1) : 0;
      const ny = ctx.rows > 1 ? y / (ctx.rows - 1) : 0;

      // --- Layer 1: Interference wave field ---
      // Multiple overlapping waves creating the organic, writhing surface
      let waveSum = 0;
      for (let w = 0; w < 3; w++) {
        const freq = (w + 1) * 1.7;
        const phase = w * 2.1 + ctx.t * speed * (w + 1) * 0.8;
        const h = Math.sin((nx * freq + phase) * Math.PI * 2);
        const v = Math.sin((ny * freq * 0.7 + phase * 1.3) * Math.PI * 2);
        waveSum += (h * 0.55 + v * 0.45) / 3;
      }
      const wave = 0.5 + 0.5 * waveSum;

      // --- Layer 2: Deep red color from wave position ---
      // Interpolate between dark and bright reds based on wave
      const wallColor = blendColor(
        blendColor(WALL_DARK, WALL_RED, wave),
        blendColor(WALL_CRIMSON, WALL_HOT, wave),
        pulse * 0.6 + wave * 0.4,
      );

      // Apply with breathing intensity
      const effectiveIntensity = intensity * (0.5 + 0.5 * breathe);
      let fg = blendColor(baseFg, wallColor, effectiveIntensity);

      // Dim cells in wave troughs for contrast / "dissolution" sparse look
      const dissolution = (1 - wave) * 0.4 * intensity;
      fg = dimRgb(fg, dissolution);

      // --- Layer 3: Heartbeat pulse flash ---
      // On the heartbeat peaks, brighten cells proportional to wave position
      if (pulse > 0.3) {
        const pulseStrength = (pulse - 0.3) / 0.7; // 0..1 during beat
        const brightAmount = pulseStrength * wave * 0.5 * intensity;
        fg = brightenRgb(fg, brightAmount);
      }

      // --- Layer 4: Vertical drip streaks (pixel sort aesthetic) ---
      const drip = dripStreak(x, y, ctx, speed, dripDensity);
      if (drip > 0) {
        // Drip head = hot white-red, trail = crimson fade
        const dripColor: RGB = drip > 0.8
          ? blendColor(WALL_CRIMSON, ACCENT_WHITE, (drip - 0.8) * 5)
          : blendColor(WALL_DARK, WALL_CRIMSON, drip);
        fg = blendColor(fg, dripColor, drip * intensity);
      }

      // --- Layer 5: Macro-block corruption ---
      if (corruption > 0 && inMacroBlock(x, y, ctx.frame, corruption * intensity)) {
        // Replace with block-uniform color (frozen artifact)
        const blockSeed = ctx.frame * 137 + Math.floor(x / 4) * 53 + Math.floor(y / 3) * 29;
        const blockBrightness = seededRandom(blockSeed + 3);
        fg = blendColor(WALL_DARK, WALL_RED, blockBrightness);

        // Occasionally corrupt the character too
        const corruptChars = '\u2591\u2592\u2593\u2588';
        if (seededRandom(blockSeed + 7) < 0.4) {
          char = corruptChars[Math.floor(seededRandom(blockSeed + 11) * corruptChars.length)];
        }
      }

      // --- Layer 6: RGB channel split (chromatic aberration) ---
      // On pulse peaks, shift red channel from a neighbor
      if (pulse > 0.5 && intensity > 0.3) {
        const splitRng = seededRandom(baseSeed + y * 73 + x * 47);
        if (splitRng < 0.15 * intensity) {
          const splitOffset = Math.round(splitRng * 3) + 1;
          const neighborX = Math.min(ctx.cols - 1, x + splitOffset);
          const neighborFg = grid[y][neighborX].fg ?? baseFg;
          // Shift red channel from neighbor, keep own green/blue
          fg = [
            Math.min(255, Math.round(neighborFg[0] * 0.7 + fg[0] * 0.3)),
            fg[1],
            fg[2],
          ];
        }
      }

      // --- Layer 7: Rare hot cyan/white accent flashes ---
      const flashRng = seededRandom(baseSeed + y * 89 + x * 61);
      if (flashRng < 0.02 * pulse * intensity) {
        // Rare searing accent — cyan or white
        const accent = flashRng < 0.01 * pulse * intensity ? ACCENT_CYAN : ACCENT_WHITE;
        fg = blendColor(fg, accent, 0.6 + flashRng * 10);
      }

      return {
        char,
        fg,
        bg: cell.bg ? ([...cell.bg] as RGB) : undefined,
      };
    }),
  );
}

registerEffect({
  key: 'blackwall',
  name: 'Blackwall',
  description: 'Layered crimson energy barrier with heartbeat pulse, drip streaks, and digital corruption',
  defaults: { intensity: 0.85, corruption: 0.06, speed: 1, dripDensity: 0.2 },
  paramMeta: {
    intensity: { label: 'Intensity', min: 0.1, max: 1, step: 0.05 },
    corruption: { label: 'Corruption', min: 0, max: 0.3, step: 0.005 },
    speed: { label: 'Speed', min: 0.3, max: 3, step: 0.1 },
    dripDensity: { label: 'Drip Density', min: 0, max: 0.6, step: 0.05 },
  },
  apply: applyBlackwall,
});
