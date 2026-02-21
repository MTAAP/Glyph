import type { StateCreator } from 'zustand';
import type { AppState } from './types';
import type { AnimationSettings, ActiveEffect } from '@/shared/types';
import { getAnimationPreset } from '@/features/animation/presets';

export const DEFAULT_ANIMATION: AnimationSettings = {
  enabled: false,
  effects: [],
  fps: 24,
  cycleDuration: 3,
  loopMode: 'loop',
  presetKey: 'none',
};

export interface AnimationSlice {
  animation: AnimationSettings;
  animationPlaying: boolean;

  updateAnimation: (partial: Partial<AnimationSettings>) => void;
  setAnimationPlaying: (playing: boolean) => void;
  addEffect: (key: string, params?: Record<string, number>) => void;
  removeEffect: (index: number) => void;
  updateEffectParams: (index: number, params: Record<string, number>) => void;
  reorderEffects: (fromIndex: number, toIndex: number) => void;
  applyAnimationPreset: (presetKey: string) => void;
}

export const createAnimationSlice: StateCreator<
  AppState,
  [],
  [],
  AnimationSlice
> = (set) => ({
  animation: DEFAULT_ANIMATION,
  animationPlaying: false,

  updateAnimation: (partial) =>
    set((state) => {
      const next = { ...state.animation, ...partial };
      // When animation is disabled, stop playback
      if (!next.enabled) {
        return { animation: next, animationPlaying: false };
      }
      return { animation: next };
    }),
  setAnimationPlaying: (animationPlaying) => set({ animationPlaying }),
  addEffect: (key, params) =>
    set((state) => {
      const effect: ActiveEffect = { key, params: params ?? {} };
      return {
        animation: {
          ...state.animation,
          effects: [...state.animation.effects, effect],
          presetKey: 'custom',
        },
      };
    }),
  removeEffect: (index) =>
    set((state) => {
      const effects = state.animation.effects.filter((_, i) => i !== index);
      return {
        animation: { ...state.animation, effects, presetKey: 'custom' },
      };
    }),
  updateEffectParams: (index, params) =>
    set((state) => {
      const effects = state.animation.effects.map((e, i) =>
        i === index ? { ...e, params: { ...e.params, ...params } } : e,
      );
      return {
        animation: { ...state.animation, effects, presetKey: 'custom' },
      };
    }),
  reorderEffects: (fromIndex, toIndex) =>
    set((state) => {
      const effects = [...state.animation.effects];
      const [moved] = effects.splice(fromIndex, 1);
      effects.splice(toIndex, 0, moved);
      return {
        animation: { ...state.animation, effects, presetKey: 'custom' },
      };
    }),
  applyAnimationPreset: (presetKey) =>
    set((state) => {
      if (presetKey === 'none') {
        return { animation: { ...DEFAULT_ANIMATION }, animationPlaying: false };
      }
      const preset = getAnimationPreset(presetKey);
      if (!preset) return {};
      const updates: Partial<AppState> = {
        animation: {
          ...DEFAULT_ANIMATION,
          enabled: true,
          effects: preset.effects.map((e) => ({ ...e, params: { ...e.params } })),
          cycleDuration: preset.cycleDuration,
          loopMode: preset.loopMode,
          presetKey,
        },
      };
      // Auto-switch color mode when the preset requires it
      if (preset.colorMode && state.settings.colorMode !== preset.colorMode) {
        updates.settings = { ...state.settings, colorMode: preset.colorMode };
      }
      return updates;
    }),
});
