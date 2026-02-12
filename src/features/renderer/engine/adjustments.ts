import type { SampleResult } from './sampler';

/**
 * Applies brightness and contrast adjustments to sampled color data.
 *
 * Brightness: -100 to +100, adds offset to RGB values
 * Contrast: -100 to +100, scales RGB values around mid-gray (128)
 *
 * Formula:
 *   adjusted = clamp(128 + (value + brightness_offset - 128) * contrast_factor, 0, 255)
 *
 * When both are 0, no adjustment is applied.
 */
export function applyAdjustments(
  samples: SampleResult,
  brightness: number,
  contrast: number,
): SampleResult {
  // Skip processing if no adjustments needed
  if (brightness === 0 && contrast === 0) {
    return samples;
  }

  // Convert brightness from -100..+100 to -128..+128
  const brightnessOffset = (brightness / 100) * 128;

  // Convert contrast from -100..+100 to 0..2 (with 0 being 1.0)
  // -100 -> 0.0, 0 -> 1.0, +100 -> 2.0
  const contrastFactor = 1 + contrast / 100;

  const adjustedSamples: { r: number; g: number; b: number; a: number }[][] = [];

  for (let y = 0; y < samples.rows; y++) {
    const row = samples.samples[y];
    const adjustedRow: { r: number; g: number; b: number; a: number }[] = [];

    for (let x = 0; x < row.length; x++) {
      const { r, g, b, a } = row[x];

      adjustedRow.push({
        r: clamp(128 + (r + brightnessOffset - 128) * contrastFactor),
        g: clamp(128 + (g + brightnessOffset - 128) * contrastFactor),
        b: clamp(128 + (b + brightnessOffset - 128) * contrastFactor),
        a,
      });
    }

    adjustedSamples.push(adjustedRow);
  }

  return {
    ...samples,
    samples: adjustedSamples,
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
