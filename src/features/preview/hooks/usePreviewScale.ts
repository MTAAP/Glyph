import { useState, useEffect, type RefObject } from 'react';

export type ScaleMode = 'fit' | '1:1' | 'custom';

interface PreviewScaleResult {
  scale: number;
  fitScale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Computes a scale for preview content based on the given mode.
 * - 'fit': auto-scale to fill the container with padding
 * - '1:1': actual size (scale = 1)
 * - 'custom': use the provided customScale value
 */
export function usePreviewScale(
  containerRef: RefObject<HTMLElement | null>,
  contentWidth: number,
  contentHeight: number,
  mode: ScaleMode = 'fit',
  customScale: number = 1,
): PreviewScaleResult {
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

  // Always compute fit scale for reference
  let fitScale = 1;
  if (contentWidth > 0 && contentHeight > 0 && containerSize.width > 0 && containerSize.height > 0) {
    const padding = 32;
    const availW = containerSize.width - padding;
    const availH = containerSize.height - padding;
    fitScale = Math.min(availW / contentWidth, availH / contentHeight);
  }

  let scale: number;
  switch (mode) {
    case 'fit':
      scale = fitScale;
      break;
    case '1:1':
      scale = 1;
      break;
    case 'custom':
      scale = customScale;
      break;
  }

  const offsetX = Math.max(0, (containerSize.width - contentWidth * scale) / 2);
  const offsetY = Math.max(0, (containerSize.height - contentHeight * scale) / 2);

  return { scale, fitScale, offsetX, offsetY };
}
