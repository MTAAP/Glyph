import type { StateCreator } from 'zustand';
import type { AppState } from './types';
import type { SourceInfo, RenderResult } from '@/shared/types';

export interface SourceSlice {
  // Source media
  sourceImage: HTMLImageElement | null;
  sourceVideo: HTMLVideoElement | null;
  sourceInfo: SourceInfo | null;
  sourceCanvas: HTMLCanvasElement | null;

  // Render output
  renderResult: RenderResult | null;
  isRendering: boolean;

  // Actions
  setSource: (image: HTMLImageElement | null, video: HTMLVideoElement | null, info: SourceInfo | null) => void;
  setSourceCanvas: (canvas: HTMLCanvasElement | null) => void;
  setRenderResult: (result: RenderResult | null) => void;
  setIsRendering: (rendering: boolean) => void;
}

export const createSourceSlice: StateCreator<
  AppState,
  [],
  [],
  SourceSlice
> = (set) => ({
  sourceImage: null,
  sourceVideo: null,
  sourceInfo: null,
  sourceCanvas: null,

  renderResult: null,
  isRendering: false,

  setSource: (image, video, info) => set({
    sourceImage: image,
    sourceVideo: video,
    sourceInfo: info,
    cropEnabled: false,
    cropRect: null,
    cropAspectRatio: 'free',
  }),
  setSourceCanvas: (canvas) => set({ sourceCanvas: canvas }),
  setRenderResult: (result) => set({ renderResult: result }),
  setIsRendering: (isRendering) => set({ isRendering }),
});
