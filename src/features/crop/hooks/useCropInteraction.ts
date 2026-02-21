import { useRef, useCallback, useState, type RefObject } from 'react';
import type { CropRect, HandlePosition, AspectRatioPreset } from '@/features/crop/types';
import { aspectRatioValue } from '@/features/crop/types';

const MIN_PX = 10;

interface DragState {
  type: 'handle' | 'move';
  handle?: HandlePosition;
  startX: number; // Client X
  startY: number; // Client Y
  startRectPx: CropRect; // Pixels relative to imageDisplayRect
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function resizeFreePx(r: CropRect, dx: number, dy: number, handle: HandlePosition, maxW: number, maxH: number): CropRect {
  const right = r.x + r.width;
  const bottom = r.y + r.height;
  let x = r.x, y = r.y, w = r.width, h = r.height;

  if (handle.includes('left')) {
    const newLeft = clamp(r.x + dx, 0, right - MIN_PX);
    w = right - newLeft;
    x = newLeft;
  }
  if (handle.includes('right')) {
    w = clamp(r.width + dx, MIN_PX, maxW - r.x);
  }
  if (handle.includes('top')) {
    const newTop = clamp(r.y + dy, 0, bottom - MIN_PX);
    h = bottom - newTop;
    y = newTop;
  }
  if (handle.includes('bottom')) {
    h = clamp(r.height + dy, MIN_PX, maxH - r.y);
  }

  return { x, y, width: w, height: h };
}

function resizeConstrainedPx(
  r: CropRect,
  dx: number,
  dy: number,
  handle: HandlePosition,
  ratio: number,
  maxW: number,
  maxH: number,
): CropRect {
  const isCorner = handle.includes('-');
  const isHorizontalEdge = handle === 'top' || handle === 'bottom';

  let newW: number, newH: number;

  if (isCorner) {
    const signX = handle.includes('right') ? 1 : -1;
    const signY = handle.includes('bottom') ? 1 : -1;
    const projLength = (dx * signX * ratio + dy * signY) / (ratio * ratio + 1);
    newW = r.width + projLength * ratio;
    newH = newW / ratio;
  } else if (isHorizontalEdge) {
    const signY = handle === 'bottom' ? 1 : -1;
    newH = r.height + dy * signY;
    newW = newH * ratio;
  } else {
    const signX = handle === 'right' ? 1 : -1;
    newW = r.width + dx * signX;
    newH = newW / ratio;
  }

  const minW = Math.max(MIN_PX, MIN_PX * ratio);
  newW = Math.max(minW, newW);
  newH = newW / ratio;

  let availableW = maxW;
  let availableH = maxH;
  
  if (handle.includes('right')) availableW = maxW - r.x;
  else if (handle.includes('left')) availableW = r.x + r.width;
  else availableW = Math.min(r.x + r.width / 2, maxW - (r.x + r.width / 2)) * 2;

  if (handle.includes('bottom')) availableH = maxH - r.y;
  else if (handle.includes('top')) availableH = r.y + r.height;
  else availableH = Math.min(r.y + r.height / 2, maxH - (r.y + r.height / 2)) * 2;

  const maxAllowedW = Math.min(availableW, availableH * ratio);
  
  if (newW > maxAllowedW) {
    newW = maxAllowedW;
    newH = newW / ratio;
  }

  let newX: number, newY: number;

  if (isCorner) {
    switch (handle) {
      case 'bottom-right': newX = r.x; newY = r.y; break;
      case 'bottom-left':  newX = r.x + r.width - newW; newY = r.y; break;
      case 'top-right':    newX = r.x; newY = r.y + r.height - newH; break;
      case 'top-left':     newX = r.x + r.width - newW; newY = r.y + r.height - newH; break;
      default: newX = r.x; newY = r.y;
    }
  } else if (isHorizontalEdge) {
    const cx = r.x + r.width / 2;
    newX = cx - newW / 2;
    newY = handle === 'bottom' ? r.y : r.y + r.height - newH;
  } else {
    const cy = r.y + r.height / 2;
    newX = handle === 'right' ? r.x : r.x + r.width - newW;
    newY = cy - newH / 2;
  }

  return { x: newX, y: newY, width: newW, height: newH };
}

const HANDLE_CURSORS: Record<HandlePosition, string> = {
  'top-left': 'nwse-resize',
  'top': 'ns-resize',
  'top-right': 'nesw-resize',
  'left': 'ew-resize',
  'right': 'ew-resize',
  'bottom-left': 'nesw-resize',
  'bottom': 'ns-resize',
  'bottom-right': 'nwse-resize',
};

export function useCropInteraction(
  containerRef: RefObject<HTMLElement | null>,
  imageDisplayRect: { x: number; y: number; width: number; height: number } | null,
  cropRect: CropRect,
  onCropChange: (rect: CropRect) => void,
  aspectRatio: AspectRatioPreset,
) {
  const dragRef = useRef<DragState | null>(null);
  const [cursorStyle, setCursorStyle] = useState('default');

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle?: HandlePosition) => {
      e.preventDefault();
      if (!imageDisplayRect || !containerRef.current) return;
      containerRef.current.setPointerCapture(e.pointerId);

      const startRectPx = {
        x: cropRect.x * imageDisplayRect.width,
        y: cropRect.y * imageDisplayRect.height,
        width: cropRect.width * imageDisplayRect.width,
        height: cropRect.height * imageDisplayRect.height,
      };

      dragRef.current = {
        type: handle ? 'handle' : 'move',
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startRectPx,
      };
      setCursorStyle(handle ? HANDLE_CURSORS[handle] : 'move');
    },
    [cropRect, imageDisplayRect, containerRef],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !imageDisplayRect) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const r = drag.startRectPx;
      const ratio = aspectRatioValue(aspectRatio);

      const maxW = imageDisplayRect.width;
      const maxH = imageDisplayRect.height;

      let newRectPx: CropRect;

      if (drag.type === 'move') {
        newRectPx = {
          ...r,
          x: clamp(r.x + dx, 0, maxW - r.width),
          y: clamp(r.y + dy, 0, maxH - r.height),
        };
      } else {
        const handle = drag.handle!;
        newRectPx = ratio
          ? resizeConstrainedPx(r, dx, dy, handle, ratio, maxW, maxH)
          : resizeFreePx(r, dx, dy, handle, maxW, maxH);
      }

      // Convert back to normalized coordinates
      onCropChange({
        x: newRectPx.x / maxW,
        y: newRectPx.y / maxH,
        width: newRectPx.width / maxW,
        height: newRectPx.height / maxH,
      });
    },
    [onCropChange, aspectRatio, imageDisplayRect],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setCursorStyle('default');
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cursorStyle,
  };
}
