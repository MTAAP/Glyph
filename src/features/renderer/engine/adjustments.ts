import type { SampleResult } from './sampler';
import { rgbToHsl, hslToRgb } from '@/shared/utils/color';

/**
 * Applies brightness, contrast, saturation, and hue shift adjustments to sampled color data.
 *
 * Brightness: -100 to +100, adds offset to RGB values
 * Contrast: -100 to +100, scales RGB values around mid-gray (128)
 * Saturation: 0 to 200, default 100 (no change). 0 = grayscale, 200 = double saturation.
 * Hue shift: 0 to 360, default 0 (no change). Rotates hue by degrees.
 *
 * Pipeline: brightness/contrast first, then saturation/hue shift.
 *
 * Formula (brightness/contrast):
 *   adjusted = clamp(128 + (value + brightness_offset - 128) * contrast_factor, 0, 255)
 *
 * When all adjustments are at defaults, no processing is applied.
 */
export function applyAdjustments(
  samples: SampleResult,
  brightness: number,
  contrast: number,
  saturation: number = 100,
  hueShift: number = 0,
): SampleResult {
  // Skip processing if no adjustments needed
  if (brightness === 0 && contrast === 0 && saturation === 100 && hueShift === 0) {
    return samples;
  }

  // Convert brightness from -100..+100 to -128..+128
  const brightnessOffset = (brightness / 100) * 128;

  // Convert contrast from -100..+100 to 0..2 (with 0 being 1.0)
  // -100 -> 0.0, 0 -> 1.0, +100 -> 2.0
  const contrastFactor = 1 + contrast / 100;

  const needsBrightnessContrast = brightness !== 0 || contrast !== 0;
  const needsSaturationHue = saturation !== 100 || hueShift !== 0;
  const saturationFactor = saturation / 100;

  const adjustedSamples: { r: number; g: number; b: number; a: number }[][] = [];

  for (let y = 0; y < samples.rows; y++) {
    const row = samples.samples[y];
    const adjustedRow: { r: number; g: number; b: number; a: number }[] = [];

    for (let x = 0; x < row.length; x++) {
      let { r, g, b } = row[x];
      const { a } = row[x];

      // Apply brightness/contrast
      if (needsBrightnessContrast) {
        r = clamp(128 + (r + brightnessOffset - 128) * contrastFactor);
        g = clamp(128 + (g + brightnessOffset - 128) * contrastFactor);
        b = clamp(128 + (b + brightnessOffset - 128) * contrastFactor);
      }

      // Apply saturation and hue shift via HSL
      if (needsSaturationHue) {
        const [h, s, l] = rgbToHsl(r, g, b);
        const newH = (h + hueShift) % 360;
        const newS = Math.min(1, s * saturationFactor);
        const [nr, ng, nb] = hslToRgb(newH, newS, l);
        r = nr;
        g = ng;
        b = nb;
      }

      adjustedRow.push({ r, g, b, a });
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
