import { create } from 'zustand';
import type { RenderSettings, SourceInfo, RenderResult } from '@/shared/types';

interface AppState {
  // Source media
  sourceImage: HTMLImageElement | null;
  sourceVideo: HTMLVideoElement | null;
  sourceInfo: SourceInfo | null;
  sourceCanvas: HTMLCanvasElement | null;

  // Render settings
  settings: RenderSettings;

  // Render output
  renderResult: RenderResult | null;
  isRendering: boolean;

  // Video playback
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;

  // UI state
  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];

  // Actions
  setSource: (image: HTMLImageElement | null, video: HTMLVideoElement | null, info: SourceInfo | null) => void;
  setSourceCanvas: (canvas: HTMLCanvasElement | null) => void;
  updateSettings: (partial: Partial<RenderSettings>) => void;
  setRenderResult: (result: RenderResult | null) => void;
  setIsRendering: (rendering: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentFrame: (frame: number) => void;
  setTotalFrames: (total: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  action?: { label: string; onClick: () => void };
}

const DEFAULT_SETTINGS: RenderSettings = {
  outputWidth: 80,
  aspectRatioCorrection: 0.5,
  lockAspectRatio: true,

  enableLuminance: true,
  enableEdge: false,
  enableDithering: false,
  edgeThreshold: 128,
  ditheringStrength: 100,
  invertRamp: false,

  charsetPreset: 'classic',
  customCharset: ' .:-=+*#%@',
  wordSequence: 'GLYPH',
  wordMode: 'cycle' as const,
  wordThreshold: 128,

  colorMode: 'mono',
  colorDepth: 256,
  monoFgColor: '#e0e0e0',
  monoBgColor: '#1a1a1a',

  targetFPS: 10,
  playbackSpeed: 1,
  frameRange: [0, 100],
  loop: true,
};

let toastCounter = 0;

export const useAppStore = create<AppState>((set) => ({
  sourceImage: null,
  sourceVideo: null,
  sourceInfo: null,
  sourceCanvas: null,

  settings: DEFAULT_SETTINGS,

  renderResult: null,
  isRendering: false,

  isPlaying: false,
  currentFrame: 0,
  totalFrames: 0,

  theme: 'system',
  toasts: [],

  setSource: (image, video, info) => set({ sourceImage: image, sourceVideo: video, sourceInfo: info }),
  setSourceCanvas: (canvas) => set({ sourceCanvas: canvas }),
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
      return { settings: next };
    }),
  setRenderResult: (result) => set({ renderResult: result }),
  setIsRendering: (isRendering) => set({ isRendering }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setTotalFrames: (totalFrames) => set({ totalFrames }),
  setTheme: (theme) => set({ theme }),
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
