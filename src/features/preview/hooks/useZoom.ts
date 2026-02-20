import { useState, useCallback, useRef, useEffect } from 'react';
import type { ScaleMode } from './usePreviewScale';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;
const WHEEL_ZOOM_FACTOR = 0.002;

interface ZoomState {
  mode: ScaleMode;
  customScale: number;
  panX: number;
  panY: number;
}

interface ZoomResult {
  mode: ScaleMode;
  scale: number;
  panX: number;
  panY: number;
  zoomIn: () => void;
  zoomOut: () => void;
  setFit: () => void;
  setActualSize: () => void;
  zoomPercent: number;
  containerHandlers: {
    onWheel: (e: React.WheelEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

function clampScale(s: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s));
}

/**
 * Manages zoom mode, custom scale, and pan offset for the preview area.
 * The actual scale computation is handled by usePreviewScale in preview components.
 */
export function useZoom(): ZoomResult {
  const [state, setState] = useState<ZoomState>({
    mode: 'fit',
    customScale: 1,
    panX: 0,
    panY: 0,
  });

  // Track active drag listeners for cleanup on unmount
  const dragCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    return () => { dragCleanupRef.current?.(); };
  }, []);

  const setFit = useCallback(() => {
    setState({ mode: 'fit', customScale: 1, panX: 0, panY: 0 });
  }, []);

  const setActualSize = useCallback(() => {
    setState({ mode: '1:1', customScale: 1, panX: 0, panY: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => {
      const base = prev.mode === '1:1' ? 1 : prev.customScale;
      const newScale = clampScale(base + ZOOM_STEP);
      return { mode: 'custom', customScale: newScale, panX: prev.panX, panY: prev.panY };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => {
      const base = prev.mode === '1:1' ? 1 : prev.customScale;
      const newScale = clampScale(base - ZOOM_STEP);
      return { mode: 'custom', customScale: newScale, panX: prev.panX, panY: prev.panY };
    });
  }, []);

  // Mouse wheel zoom (Ctrl+scroll or pinch via trackpad)
  // Zooms toward cursor position by adjusting pan offset
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      // Capture cursor position relative to the container
      const rect = e.currentTarget.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      setState((prev) => {
        const oldScale = prev.mode === 'fit' ? 1 : prev.mode === '1:1' ? 1 : prev.customScale;
        const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
        const newScale = clampScale(oldScale + oldScale * delta);
        const ratio = newScale / oldScale;

        // Adjust pan so the point under the cursor stays fixed
        const newPanX = cursorX - (cursorX - prev.panX) * ratio;
        const newPanY = cursorY - (cursorY - prev.panY) * ratio;

        return { mode: 'custom', customScale: newScale, panX: newPanX, panY: newPanY };
      });
    },
    [],
  );

  // Pan via click-and-drag when zoomed in
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (state.mode === 'fit') return;
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('[data-zoom-controls]')) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPanX = state.panX;
      const startPanY = state.panY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        setState((prev) => ({ ...prev, panX: startPanX + dx, panY: startPanY + dy }));
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        dragCleanupRef.current = null;
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      dragCleanupRef.current = handleMouseUp;
    },
    [state.mode, state.panX, state.panY],
  );

  // For display percentage, fit mode shows 100% (fit), 1:1 shows 100%, custom shows actual
  const displayScale = state.mode === 'fit' ? 1 : state.mode === '1:1' ? 1 : state.customScale;
  const zoomPercent = Math.round(displayScale * 100);

  return {
    mode: state.mode,
    scale: state.customScale,
    panX: state.panX,
    panY: state.panY,
    zoomIn,
    zoomOut,
    setFit,
    setActualSize,
    zoomPercent,
    containerHandlers: {
      onWheel,
      onMouseDown,
    },
  };
}
