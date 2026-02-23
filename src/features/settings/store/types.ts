import type { SettingsSlice } from './settingsSlice';
import type { SourceSlice } from './sourceSlice';
import type { PlaybackSlice } from './playbackSlice';
import type { CropSlice } from './cropSlice';
import type { AnimationSlice } from './animationSlice';
import type { UiSlice } from './uiSlice';

export type AppState = SettingsSlice &
  SourceSlice &
  PlaybackSlice &
  CropSlice &
  AnimationSlice &
  UiSlice;
