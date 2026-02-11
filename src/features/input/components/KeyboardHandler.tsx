import { useEffect } from 'react';
import { useAppStore } from '@/features/settings/store';
import { CHARSET_PRESETS } from '@/features/settings/presets';

export function KeyboardHandler() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const state = useAppStore.getState();

      switch (e.key) {
        case ' ': {
          e.preventDefault();
          if (state.sourceInfo?.type === 'video') {
            state.setIsPlaying(!state.isPlaying);
          }
          break;
        }
        case 'ArrowLeft': {
          if (state.sourceInfo?.type === 'video') {
            e.preventDefault();
            state.setCurrentFrame(Math.max(0, state.currentFrame - 1));
          }
          break;
        }
        case 'ArrowRight': {
          if (state.sourceInfo?.type === 'video') {
            e.preventDefault();
            state.setCurrentFrame(Math.min(state.totalFrames - 1, state.currentFrame + 1));
          }
          break;
        }
        case 'i':
        case 'I': {
          state.updateSettings({ invertRamp: !state.settings.invertRamp });
          break;
        }
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6': {
          const idx = parseInt(e.key, 10) - 1;
          const preset = CHARSET_PRESETS[idx];
          if (preset) {
            state.updateSettings({ charsetPreset: preset.key });
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
