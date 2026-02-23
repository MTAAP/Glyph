import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState } from './store/types';
import { createSettingsSlice } from './store/settingsSlice';
import { createSourceSlice } from './store/sourceSlice';
import { createPlaybackSlice } from './store/playbackSlice';
import { createCropSlice } from './store/cropSlice';
import { createAnimationSlice } from './store/animationSlice';
import { createUiSlice } from './store/uiSlice';

export * from './store/types';
export type { Toast } from './store/uiSlice';

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createSettingsSlice(...a),
      ...createSourceSlice(...a),
      ...createPlaybackSlice(...a),
      ...createCropSlice(...a),
      ...createAnimationSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: 'glyph-settings',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0) {
          const state = persisted as { settings?: Record<string, unknown>; theme?: string };
          if (state.settings) {
            state.settings.saturation ??= 100;
            state.settings.hueShift ??= 0;
          }
          return state;
        }
        return persisted;
      },
      partialize: (state) => ({
        settings: state.settings,
        theme: state.theme,
      }),
    },
  ),
);
