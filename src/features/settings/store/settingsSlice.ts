import type { StateCreator } from 'zustand';
import type { AppState } from './types';
import type { RenderSettings } from '@/shared/types';

export const DEFAULT_SETTINGS: RenderSettings = {
  outputWidth: 200,
  aspectRatioCorrection: 0.5,
  lockAspectRatio: true,

  brightness: 0,
  contrast: 0,
  saturation: 100,
  hueShift: 0,

  enableLuminance: true,
  enableEdge: false,
  enableDithering: false,
  edgeThreshold: 128,
  ditheringStrength: 100,
  invertRamp: false,

  charsetPreset: 'classic',
  customCharset: ' .:-=+*#%@',
  wordSequence: 'GLYPH',
  wordMode: 'cycle',
  wordThreshold: 128,
  cycleDirection: 'ltr',

  enableVariableType: false,
  variableTypeItalic: false,
  variableTypeOpacity: false,
  variableTypeProportional: false,
  variableTypeFont: 'Georgia',
  variableTypeColorPreset: 'default',

  colorMode: 'mono',
  colorDepth: 256,
  monoFgColor: '#e0e0e0',
  monoBgColor: '#1a1a1a',

  targetFPS: 10,
  playbackSpeed: 1,
  frameRange: [0, 100],
  loop: true,
};

export interface SettingsSlice {
  settings: RenderSettings;
  settingsHistory: RenderSettings[];
  settingsHistoryIndex: number;
  updateSettings: (partial: Partial<RenderSettings>) => void;
  undoSettings: () => void;
  redoSettings: () => void;
}

export const createSettingsSlice: StateCreator<
  AppState,
  [],
  [],
  SettingsSlice
> = (set) => ({
  settings: DEFAULT_SETTINGS,
  settingsHistory: [DEFAULT_SETTINGS],
  settingsHistoryIndex: 0,
  
  updateSettings: (partial) =>
    set((state) => {
      const next = { ...state.settings, ...partial };
      // Enforce mutual exclusion: edge + dithering cannot both be on
      if (partial.enableEdge && next.enableDithering) {
        next.enableDithering = false;
      }
      if (partial.enableDithering && next.enableEdge) {
        next.enableEdge = false;
      }

      // Add to history
      const currentHistory = state.settingsHistory.slice(0, state.settingsHistoryIndex + 1);
      const newHistory = [...currentHistory, next];
      
      // Limit history to 50 states to prevent memory leaks
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      return { 
        settings: next,
        settingsHistory: newHistory,
        settingsHistoryIndex: newHistory.length - 1,
      };
    }),
    
  undoSettings: () =>
    set((state) => {
      if (state.settingsHistoryIndex > 0) {
        const newIndex = state.settingsHistoryIndex - 1;
        return {
          settings: state.settingsHistory[newIndex],
          settingsHistoryIndex: newIndex,
        };
      }
      return state;
    }),
    
  redoSettings: () =>
    set((state) => {
      if (state.settingsHistoryIndex < state.settingsHistory.length - 1) {
        const newIndex = state.settingsHistoryIndex + 1;
        return {
          settings: state.settingsHistory[newIndex],
          settingsHistoryIndex: newIndex,
        };
      }
      return state;
    }),
});
