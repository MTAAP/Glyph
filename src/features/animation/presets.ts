import type { ActiveEffect, LoopMode } from '@/shared/types';

export interface AnimationPreset {
  key: string;
  name: string;
  description: string;
  effects: ActiveEffect[];
  cycleDuration: number;
  loopMode: LoopMode;
  /** When set, auto-switches color mode on preset selection */
  colorMode?: 'mono' | 'foreground' | 'full';
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    key: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Pulsing neon colors with scanning lines and flicker',
    effects: [
      { key: 'colorPulse', params: { intensity: 0.7, paletteIndex: 0, speed: 1 } },
      { key: 'scanline', params: { bandWidth: 3, dimAmount: 0.4 } },
      { key: 'flicker', params: { intensity: 0.15, brightnessBoost: 0.6 } },
    ],
    cycleDuration: 4,
    loopMode: 'loop',
  },
  {
    key: 'matrix',
    name: 'Matrix',
    description: 'Digital rain with green tones',
    effects: [
      { key: 'rain', params: { density: 0.3, speed: 1, trailLength: 8 } },
      { key: 'colorPulse', params: { intensity: 0.5, paletteIndex: 2, speed: 0.5 } },
    ],
    cycleDuration: 5,
    loopMode: 'loop',
  },
  {
    key: 'blade-runner',
    name: 'Blade Runner',
    description: 'Warm amber glow with subtle glitch and scanning',
    effects: [
      { key: 'colorPulse', params: { intensity: 0.6, paletteIndex: 1, speed: 0.7 } },
      { key: 'glitch', params: { intensity: 0.1, charCorruption: 0.05, rowShift: 1, colorSplit: 1 } },
      { key: 'scanline', params: { bandWidth: 5, dimAmount: 0.3 } },
    ],
    cycleDuration: 6,
    loopMode: 'loop',
  },
  {
    key: 'vhs-glitch',
    name: 'VHS Glitch',
    description: 'Heavy distortion and scan artifacts',
    effects: [
      { key: 'glitch', params: { intensity: 0.6, charCorruption: 0.3, rowShift: 5, colorSplit: 3 } },
      { key: 'scanline', params: { bandWidth: 2, dimAmount: 0.6 } },
    ],
    cycleDuration: 2,
    loopMode: 'loop',
  },
  {
    key: 'typewriter',
    name: 'Typewriter',
    description: 'Character-by-character reveal',
    effects: [
      { key: 'typing', params: { direction: 0, holdFrames: 3 } },
    ],
    cycleDuration: 3,
    loopMode: 'once',
  },
  {
    key: 'neon-wave',
    name: 'Neon Wave',
    description: 'Diagonal color sweep with sparkle',
    effects: [
      { key: 'colorWave', params: { direction: 2, wavelength: 1, speed: 1 } },
      { key: 'flicker', params: { intensity: 0.2, brightnessBoost: 0.5 } },
    ],
    cycleDuration: 3,
    loopMode: 'loop',
  },
  {
    key: 'blackwall',
    name: 'Blackwall',
    description: 'Crimson energy barrier with heartbeat pulse, drip streaks, and digital corruption',
    effects: [
      { key: 'blackwall', params: { intensity: 0.85, corruption: 0.06, speed: 1, dripDensity: 0.2 } },
      { key: 'glitch', params: { intensity: 0.08, charCorruption: 0.03, rowShift: 2, colorSplit: 1 } },
    ],
    cycleDuration: 5,
    loopMode: 'loop',
    colorMode: 'foreground',
  },
];

export function getAnimationPreset(key: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find((p) => p.key === key);
}
