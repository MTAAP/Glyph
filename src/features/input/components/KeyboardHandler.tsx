import { useEffect, useRef } from 'react';
import { useAppStore } from '@/features/settings/store';
import { CHARSET_PRESETS } from '@/features/settings/presets';
import { revokeActiveBlobUrl } from '@/features/input/hooks/useFileInput';
import { useSidebarNavigation } from '@/features/settings/context/SidebarNavigationContext';

export function KeyboardHandler() {
  const { moveUp, moveDown, adjustValue, triggerAction, focusedIndex, getControls } = useSidebarNavigation();

  // Keep navigation methods in refs so event listener closure has access to current values
  const navRef = useRef({ moveUp, moveDown, adjustValue, triggerAction, focusedIndex, getControls });

  useEffect(() => {
    navRef.current = { moveUp, moveDown, adjustValue, triggerAction, focusedIndex, getControls };
  }, [moveUp, moveDown, adjustValue, triggerAction, focusedIndex, getControls]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inputType = (target as HTMLInputElement).type;
      const isTextInput =
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && (inputType === 'text' || inputType === 'url' || inputType === 'number'));

      const isPopupOpen = target.getAttribute('aria-expanded') === 'true' || target.closest('[role="listbox"], [role="menu"], [role="dialog"], [role="menuitem"]');

      const state = useAppStore.getState();
      const isInSidebar = target.closest('aside');
      const nav = navRef.current;

      switch (e.key) {
        case 's':
        case 'S': {
          // Ignore when typing in input fields
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

          // Ctrl+S / Cmd+S: download in default format
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (state.renderResult) {
              state.setFormatModalOpen(true, 'export');
            }
          } else {
            // Unmodified 's': share settings
            e.preventDefault();
            state.callbacks.shareSettings?.();
          }
          break;
        }

        case 'ArrowUp': {
          // Don't intercept when a popup/menu is open
          if (isPopupOpen) return;

          if (isInSidebar) {
            e.preventDefault();
            nav.moveUp();
          }
          break;
        }
        case 'ArrowDown': {
          // Don't intercept when a popup/menu is open
          if (isPopupOpen) return;

          if (isInSidebar) {
            e.preventDefault();
            nav.moveDown();
          }
          break;
        }
        case 'ArrowLeft': {
          // Text inputs: allow normal cursor movement
          if (isTextInput) return;

          // When in sidebar with focus, adjust value
          if (isInSidebar && nav.focusedIndex !== null) {
            e.preventDefault();
            nav.adjustValue(-1);
          } else if (state.sourceInfo?.type === 'video') {
            // Video frame navigation (existing behavior)
            e.preventDefault();
            state.setCurrentFrame(Math.max(0, state.currentFrame - 1));
          }
          break;
        }
        case 'ArrowRight': {
          // Text inputs: allow normal cursor movement
          if (isTextInput) return;

          // When in sidebar with focus, adjust value
          if (isInSidebar && nav.focusedIndex !== null) {
            e.preventDefault();
            nav.adjustValue(1);
          } else if (state.sourceInfo?.type === 'video') {
            // Video frame navigation (existing behavior)
            e.preventDefault();
            state.setCurrentFrame(Math.min(state.totalFrames - 1, state.currentFrame + 1));
          }
          break;
        }
        case ' ': {
          // Ignore when typing in input fields
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

          // Don't intercept Space for Select triggers so they can open natively
          if (target.getAttribute('role') === 'combobox') return;

          // When in sidebar with focus, trigger button action
          if (isInSidebar && nav.focusedIndex !== null) {
            e.preventDefault();
            nav.triggerAction();
          } else {
            e.preventDefault();
            if (state.sourceInfo?.type === 'video') {
              state.setIsPlaying(!state.isPlaying);
            }
          }
          break;
        }
        case 'x':
        case 'X': {
          // Ignore when typing in input fields
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

          revokeActiveBlobUrl();
          state.setSource(null, null, null);
          state.setSourceCanvas(null);
          state.setRenderResult(null);
          state.setIsPlaying(false);
          state.setCurrentFrame(0);
          state.setTotalFrames(0);
          break;
        }
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7': {
          // Ignore when typing in input fields
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

          const idx = parseInt(e.key, 10) - 1;
          const preset = CHARSET_PRESETS[idx];
          if (preset) {
            state.updateSettings({ charsetPreset: preset.key });
          }
          break;
        }
        case 'c':
        case 'C': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          if (state.renderResult) {
            state.setFormatModalOpen(true, 'copy');
          }
          break;
        }
        case 'e':
        case 'E': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          if (state.renderResult) {
            state.setFormatModalOpen(true, 'export');
          }
          break;
        }
        case 'f':
        case 'F': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          state.callbacks.toggleFullscreen?.();
          break;
        }
        case 'i':
        case 'I': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          state.updateSettings({ invertRamp: !state.settings.invertRamp });
          break;
        }
        case 'o':
        case 'O': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          state.callbacks.toggleOverlay?.();
          break;
        }
        case 't':
        case 'T': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          const themeOrder: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
          const themeIdx = themeOrder.indexOf(state.theme);
          state.setTheme(themeOrder[(themeIdx + 1) % themeOrder.length]);
          break;
        }
        case '+':
        case '=': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          e.preventDefault();
          state.callbacks.zoomIn?.();
          break;
        }
        case '-': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          e.preventDefault();
          state.callbacks.zoomOut?.();
          break;
        }
        case '0': {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
          e.preventDefault();
          state.callbacks.zoomFit?.();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
