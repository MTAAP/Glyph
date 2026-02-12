import { create } from 'zustand';
import type { RenderSettings, SourceInfo, RenderResult } from '@/shared/types';
import type { CropRect, AspectRatioPreset } from '@/features/crop/types';
import { DEFAULT_CROP, enforceAspectOnRect } from '@/features/crop/types';

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

  // Crop state
  cropEnabled: boolean;
  cropRect: CropRect | null;
  cropAspectRatio: AspectRatioPreset;

  // Cell spacing (display-only, doesn't affect render pipeline)
  cellSpacingX: number;
  cellSpacingY: number;
  spacingLinked: boolean;

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
  setCropEnabled: (enabled: boolean) => void;
  setCropRect: (rect: CropRect | null) => void;
  setCropAspectRatio: (ratio: AspectRatioPreset) => void;
  resetCrop: () => void;
  setCellSpacing: (axis: 'x' | 'y' | 'both', value: number) => void;
  setSpacingLinked: (linked: boolean) => void;
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
  outputWidth: 200,
  aspectRatioCorrection: 0.5,
  lockAspectRatio: true,

  brightness: 0,
  contrast: 0,

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
  cycleDirection: 'ltr',

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

  cropEnabled: false,
  cropRect: null,
  cropAspectRatio: 'free',

  cellSpacingX: 1.0,
  cellSpacingY: 1.0,
  spacingLinked: true,

  theme: 'system',
  toasts: [],

  setSource: (image, video, info) => set({
    sourceImage: image,
    sourceVideo: video,
    sourceInfo: info,
    cropEnabled: false,
    cropRect: null,
    cropAspectRatio: 'free',
  }),
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
  setCropEnabled: (cropEnabled) => set((state) => {
    if (cropEnabled && !state.cropRect) {
      // Initialize with default crop on first enable
      const rect = enforceAspectOnRect(DEFAULT_CROP, state.cropAspectRatio);
      return { cropEnabled: true, cropRect: rect };
    }
    // Keep cropRect when disabling so it's remembered on re-enable
    return { cropEnabled };
  }),
  setCropRect: (cropRect) => set({ cropRect }),
  setCropAspectRatio: (cropAspectRatio) => set((state) => {
    if (state.cropRect && cropAspectRatio !== 'free') {
      return { cropAspectRatio, cropRect: enforceAspectOnRect(state.cropRect, cropAspectRatio) };
    }
    return { cropAspectRatio };
  }),
  resetCrop: () => set({
    cropRect: null,
    cropEnabled: false,
  }),
  setCellSpacing: (axis, value) => {
    const clamped = Math.min(3.0, Math.max(0.5, value));
    set((state) => {
      if (state.spacingLinked || axis === 'both') {
        return { cellSpacingX: clamped, cellSpacingY: clamped };
      }
      if (axis === 'x') return { cellSpacingX: clamped };
      return { cellSpacingY: clamped };
    });
  },
  setSpacingLinked: (linked) => set((state) => {
    if (linked) {
      // Sync Y to X when re-linking
      return { spacingLinked: true, cellSpacingY: state.cellSpacingX };
    }
    return { spacingLinked: false };
  }),
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
