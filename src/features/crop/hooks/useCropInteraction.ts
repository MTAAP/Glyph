import { useRef, useCallback, useState, type RefObject } from 'react';
import type { CropRect, HandlePosition, AspectRatioPreset } from '@/features/crop/types';
import { aspectRatioValue } from '@/features/crop/types';

const MIN_SIZE = 0.05;

interface DragState {
  type: 'handle' | 'move';
  handle?: HandlePosition;
  startX: number;
  startY: number;
  startRect: CropRect;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Free resize — each handle moves its edges independently */
function resizeFree(r: CropRect, dx: number, dy: number, handle: HandlePosition): CropRect {
  const right = r.x + r.width;
  const bottom = r.y + r.height;
  let x = r.x, y = r.y, w = r.width, h = r.height;

  if (handle.includes('left')) {
    const newLeft = clamp(r.x + dx, 0, right - MIN_SIZE);
    w = right - newLeft;
    x = newLeft;
  }
  if (handle.includes('right')) {
    w = clamp(r.width + dx, MIN_SIZE, 1 - r.x);
  }
  if (handle.includes('top')) {
    const newTop = clamp(r.y + dy, 0, bottom - MIN_SIZE);
    h = bottom - newTop;
    y = newTop;
  }
  if (handle.includes('bottom')) {
    h = clamp(r.height + dy, MIN_SIZE, 1 - r.y);
  }

  return { x, y, width: w, height: h };
}

/** Constrained resize — maintains aspect ratio */
function resizeConstrained(
  r: CropRect,
  dx: number,
  dy: number,
  handle: HandlePosition,
  ratio: number,
): CropRect {
  const isCorner = handle.includes('-');
  const isHorizontalEdge = handle === 'top' || handle === 'bottom';

  let newW: number, newH: number;

  if (isCorner) {
    // Project mouse movement onto the aspect ratio diagonal for natural feel
    const signX = handle.includes('right') ? 1 : -1;
    const signY = handle.includes('bottom') ? 1 : -1;
    const projLength = (dx * signX * ratio + dy * signY) / (ratio * ratio + 1);
    newW = r.width + projLength * ratio;
    newH = newW / ratio;
  } else if (isHorizontalEdge) {
    // Height is primary axis
    const signY = handle === 'bottom' ? 1 : -1;
    newH = r.height + dy * signY;
    newW = newH * ratio;
  } else {
    // Width is primary axis (left/right edges)
    const signX = handle === 'right' ? 1 : -1;
    newW = r.width + dx * signX;
    newH = newW / ratio;
  }

  // Enforce minimum size that satisfies both MIN_SIZE and the ratio
  const minW = Math.max(MIN_SIZE, MIN_SIZE * ratio);
  newW = Math.max(minW, newW);
  newH = newW / ratio;

  // Compute position based on which edges are anchored
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
    // Center horizontally around original center
    const cx = r.x + r.width / 2;
    newX = cx - newW / 2;
    newY = handle === 'bottom' ? r.y : r.y + r.height - newH;
  } else {
    // Center vertically around original center
    const cy = r.y + r.height / 2;
    newX = handle === 'right' ? r.x : r.x + r.width - newW;
    newY = cy - newH / 2;
  }

  // Clamp position to bounds
  newX = clamp(newX, 0, 1 - newW);
  newY = clamp(newY, 0, 1 - newH);

  // If dimensions still exceed bounds after clamping position, shrink to fit
  if (newW > 1 - newX) { newW = 1 - newX; newH = newW / ratio; }
  if (newH > 1 - newY) { newH = 1 - newY; newW = newH * ratio; }

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

  // Convert viewport client coords to normalized 0-1 image coords
  const clientToNormalized = useCallback(
    (clientX: number, clientY: number): { nx: number; ny: number } => {
      if (!imageDisplayRect || !containerRef.current) return { nx: 0, ny: 0 };
      const bounds = containerRef.current.getBoundingClientRect();
      const localX = clientX - bounds.left;
      const localY = clientY - bounds.top;
      return {
        nx: clamp((localX - imageDisplayRect.x) / imageDisplayRect.width, 0, 1),
        ny: clamp((localY - imageDisplayRect.y) / imageDisplayRect.height, 0, 1),
      };
    },
    [imageDisplayRect, containerRef],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle?: HandlePosition) => {
      e.preventDefault();
      // Capture on the container so its onPointerMove/onPointerUp fire during drag
      containerRef.current?.setPointerCapture(e.pointerId);
      const { nx, ny } = clientToNormalized(e.clientX, e.clientY);
      dragRef.current = {
        type: handle ? 'handle' : 'move',
        handle,
        startX: nx,
        startY: ny,
        startRect: { ...cropRect },
      };
      setCursorStyle(handle ? HANDLE_CURSORS[handle] : 'move');
    },
    [clientToNormalized, cropRect, containerRef],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const { nx, ny } = clientToNormalized(e.clientX, e.clientY);
      const dx = nx - drag.startX;
      const dy = ny - drag.startY;
      const r = drag.startRect;
      const ratio = aspectRatioValue(aspectRatio);

      if (drag.type === 'move') {
        onCropChange({
          ...r,
          x: clamp(r.x + dx, 0, 1 - r.width),
          y: clamp(r.y + dy, 0, 1 - r.height),
        });
        return;
      }

      const handle = drag.handle!;
      const newRect = ratio
        ? resizeConstrained(r, dx, dy, handle, ratio)
        : resizeFree(r, dx, dy, handle);

      onCropChange(newRect);
    },
    [clientToNormalized, onCropChange, aspectRatio],
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
