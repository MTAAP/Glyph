import type { StateCreator } from 'zustand';
import type { AppState } from './types';
import type { CropRect, AspectRatioPreset } from '@/features/crop/types';
import { DEFAULT_CROP, enforceAspectOnRect } from '@/features/crop/types';

export interface CropSlice {
  cropEnabled: boolean;
  cropRect: CropRect | null;
  cropAspectRatio: AspectRatioPreset;

  setCropEnabled: (enabled: boolean) => void;
  setCropRect: (rect: CropRect | null) => void;
  setCropAspectRatio: (ratio: AspectRatioPreset) => void;
  resetCrop: () => void;
}

export const createCropSlice: StateCreator<
  AppState,
  [],
  [],
  CropSlice
> = (set) => ({
  cropEnabled: false,
  cropRect: null,
  cropAspectRatio: 'free',

  setCropEnabled: (cropEnabled) => set((state) => {
    if (cropEnabled && !state.cropRect) {
      // Initialize with default crop on first enable
      const imageAspect = state.sourceInfo ? state.sourceInfo.width / state.sourceInfo.height : 1;
      const rect = enforceAspectOnRect(DEFAULT_CROP, state.cropAspectRatio, imageAspect);
      return { cropEnabled: true, cropRect: rect };
    }
    // Keep cropRect when disabling so it's remembered on re-enable
    return { cropEnabled };
  }),
  setCropRect: (cropRect) => set({ cropRect }),
  setCropAspectRatio: (cropAspectRatio) => set((state) => {
    if (state.cropRect && cropAspectRatio !== 'free') {
      const imageAspect = state.sourceInfo ? state.sourceInfo.width / state.sourceInfo.height : 1;
      return { cropAspectRatio, cropRect: enforceAspectOnRect(state.cropRect, cropAspectRatio, imageAspect) };
    }
    return { cropAspectRatio };
  }),
  resetCrop: () => set({
    cropRect: null,
    cropEnabled: false,
  }),
});
