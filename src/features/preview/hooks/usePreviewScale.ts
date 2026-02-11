import { useState, useEffect, useCallback, type RefObject } from 'react';

interface PreviewScaleResult {
  scale: number;
  offsetX: number;
  offsetY: number;
  mode: 'fit' | '1:1' | 'custom';
  setMode: (mode: 'fit' | '1:1' | 'custom', customZoom?: number) => void;
}

export function usePreviewScale(
  containerRef: RefObject<HTMLElement | null>,
  contentWidth: number,
  contentHeight: number,
): PreviewScaleResult {
  const [mode, setModeState] = useState<'fit' | '1:1' | 'custom'>('fit');
  const [customZoom, setCustomZoom] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const setMode = useCallback((newMode: 'fit' | '1:1' | 'custom', zoom?: number) => {
    setModeState(newMode);
    if (newMode === 'custom' && zoom !== undefined) {
      setCustomZoom(zoom);
    }
  }, []);

  let scale = 1;
  if (contentWidth > 0 && contentHeight > 0 && containerSize.width > 0 && containerSize.height > 0) {
    switch (mode) {
      case 'fit': {
        const padding = 32;
        const availW = containerSize.width - padding;
        const availH = containerSize.height - padding;
        scale = Math.min(availW / contentWidth, availH / contentHeight);
        break;
      }
      case '1:1':
        scale = 1;
        break;
      case 'custom':
        scale = customZoom;
        break;
    }
  }

  const offsetX = Math.max(0, (containerSize.width - contentWidth * scale) / 2);
  const offsetY = Math.max(0, (containerSize.height - contentHeight * scale) / 2);

  return { scale, offsetX, offsetY, mode, setMode };
}
