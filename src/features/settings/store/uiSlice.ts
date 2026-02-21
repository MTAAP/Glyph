import type { StateCreator } from 'zustand';
import type { AppState } from './types';

export interface Toast {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  action?: { label: string; onClick: () => void };
}

export interface UiSlice {
  // Cell spacing (display-only, doesn't affect render pipeline)
  cellSpacingX: number;
  cellSpacingY: number;
  spacingLinked: boolean;

  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];
  sidebarFocusIndex: number | null;
  formatModalOpen: boolean;
  formatModalMode: 'copy' | 'export';
  triggerFilePicker: number;
  callbacks: {
    toggleFullscreen?: () => void;
    toggleOverlay?: () => void;
    zoomIn?: () => void;
    zoomOut?: () => void;
    zoomFit?: () => void;
    shareSettings?: () => void;
  };

  setCallbacks: (callbacks: Partial<UiSlice['callbacks']>) => void;
  setCellSpacing: (axis: 'x' | 'y' | 'both', value: number) => void;
  setSpacingLinked: (linked: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setSidebarFocusIndex: (index: number | null) => void;
  setFormatModalOpen: (open: boolean, mode?: 'copy' | 'export') => void;
  openFilePicker: () => void;
}

let toastCounter = 0;

export const createUiSlice: StateCreator<
  AppState,
  [],
  [],
  UiSlice
> = (set) => ({
  cellSpacingX: 1.0,
  cellSpacingY: 1.0,
  spacingLinked: true,

  theme: 'system',
  toasts: [],
  sidebarFocusIndex: null,
  formatModalOpen: false,
  formatModalMode: 'copy',
  triggerFilePicker: 0,
  callbacks: {},

  setCallbacks: (callbacks) => set((state) => ({
    callbacks: { ...state.callbacks, ...callbacks }
  })),

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
  setSidebarFocusIndex: (sidebarFocusIndex) => set({ sidebarFocusIndex }),
  setFormatModalOpen: (open, mode) => set((state) => ({
    formatModalOpen: open,
    formatModalMode: mode ?? state.formatModalMode,
  })),
  openFilePicker: () => set((state) => ({ triggerFilePicker: (state.triggerFilePicker ?? 0) + 1 })),
});
