import type { StateCreator } from 'zustand';
import type { AppState } from './types';

export interface PlaybackSlice {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;

  setIsPlaying: (playing: boolean) => void;
  setCurrentFrame: (frame: number) => void;
  setTotalFrames: (total: number) => void;
}

export const createPlaybackSlice: StateCreator<
  AppState,
  [],
  [],
  PlaybackSlice
> = (set) => ({
  isPlaying: false,
  currentFrame: 0,
  totalFrames: 0,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setTotalFrames: (totalFrames) => set({ totalFrames }),
});
