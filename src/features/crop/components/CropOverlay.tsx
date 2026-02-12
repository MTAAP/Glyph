import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/features/settings/store';
import { useCropInteraction } from '@/features/crop/hooks/useCropInteraction';
import type { CropRect, HandlePosition } from '@/features/crop/types';

const HANDLES: HandlePosition[] = [
  'top-left', 'top', 'top-right',
  'left', 'right',
  'bottom-left', 'bottom', 'bottom-right',
];

const HANDLE_SIZE = 10;
const HIT_AREA_SIZE = 24;

function handleStyle(pos: HandlePosition): React.CSSProperties {
  const half = -HANDLE_SIZE / 2;
  const base: React.CSSProperties = {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    background: 'white',
    border: '1px solid rgba(0,0,0,0.4)',
    borderRadius: 2,
    zIndex: 2,
  };

  switch (pos) {
    case 'top-left':     return { ...base, top: half, left: half };
    case 'top':          return { ...base, top: half, left: '50%', marginLeft: half };
    case 'top-right':    return { ...base, top: half, right: half };
    case 'left':         return { ...base, top: '50%', marginTop: half, left: half };
    case 'right':        return { ...base, top: '50%', marginTop: half, right: half };
    case 'bottom-left':  return { ...base, bottom: half, left: half };
    case 'bottom':       return { ...base, bottom: half, left: '50%', marginLeft: half };
    case 'bottom-right': return { ...base, bottom: half, right: half };
  }
}

function hitAreaStyle(pos: HandlePosition): React.CSSProperties {
  const half = -HIT_AREA_SIZE / 2;
  const base: React.CSSProperties = { position: 'absolute', width: HIT_AREA_SIZE, height: HIT_AREA_SIZE, zIndex: 3 };
  const cursors: Record<HandlePosition, string> = {
    'top-left': 'nwse-resize', 'top': 'ns-resize', 'top-right': 'nesw-resize',
    'left': 'ew-resize', 'right': 'ew-resize',
    'bottom-left': 'nesw-resize', 'bottom': 'ns-resize', 'bottom-right': 'nwse-resize',
  };

  switch (pos) {
    case 'top-left':     return { ...base, top: half, left: half, cursor: cursors[pos] };
    case 'top':          return { ...base, top: half, left: '50%', marginLeft: half, cursor: cursors[pos] };
    case 'top-right':    return { ...base, top: half, right: half, cursor: cursors[pos] };
    case 'left':         return { ...base, top: '50%', marginTop: half, left: half, cursor: cursors[pos] };
    case 'right':        return { ...base, top: '50%', marginTop: half, right: half, cursor: cursors[pos] };
    case 'bottom-left':  return { ...base, bottom: half, left: half, cursor: cursors[pos] };
    case 'bottom':       return { ...base, bottom: half, left: '50%', marginLeft: half, cursor: cursors[pos] };
    case 'bottom-right': return { ...base, bottom: half, right: half, cursor: cursors[pos] };
  }
}

export function CropOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sourceImage = useAppStore((s) => s.sourceImage);
  const sourceVideo = useAppStore((s) => s.sourceVideo);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const cropRect = useAppStore((s) => s.cropRect);
  const cropAspectRatio = useAppStore((s) => s.cropAspectRatio);
  const setCropRect = useAppStore((s) => s.setCropRect);
  const currentFrame = useAppStore((s) => s.currentFrame);

  const source = sourceImage ?? sourceVideo;

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute letterboxed image display rect within the full container
  const srcAspect = sourceInfo ? sourceInfo.width / sourceInfo.height : 1;
  const { width: cw, height: ch } = containerSize;
  let imgW: number, imgH: number;

  if (srcAspect > cw / ch) {
    imgW = cw;
    imgH = cw / srcAspect;
  } else {
    imgH = ch;
    imgW = ch * srcAspect;
  }
  const imgX = (cw - imgW) / 2;
  const imgY = (ch - imgH) / 2;

  const imageRect = cw > 0 && ch > 0
    ? { x: imgX, y: imgY, width: imgW, height: imgH }
    : null;

  // Draw source onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source || cw <= 0 || ch <= 0) return;

    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(source, imgX, imgY, imgW, imgH);
  }, [source, cw, ch, imgX, imgY, imgW, imgH, currentFrame]);

  const onCropChange = useCallback(
    (rect: CropRect) => setCropRect(rect),
    [setCropRect],
  );

  const { handlePointerDown, handlePointerMove, handlePointerUp, cursorStyle } =
    useCropInteraction(containerRef, imageRect, cropRect!, onCropChange, cropAspectRatio);

  if (!source || !sourceInfo || !cropRect || cw <= 0 || ch <= 0) {
    return <div ref={containerRef} className="absolute inset-0" />;
  }

  // Convert normalized crop to pixel positions within the display area
  const cropLeft = imgX + cropRect.x * imgW;
  const cropTop = imgY + cropRect.y * imgH;
  const cropWidth = cropRect.width * imgW;
  const cropHeight = cropRect.height * imgH;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none"
      style={{ cursor: cursorStyle }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Source image canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Dimmed overlay regions — top, bottom, left, right of crop box */}
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{ left: imgX, top: imgY, width: imgW, height: cropTop - imgY }}
      />
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{
          left: imgX,
          top: cropTop + cropHeight,
          width: imgW,
          height: imgY + imgH - (cropTop + cropHeight),
        }}
      />
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{ left: imgX, top: cropTop, width: cropLeft - imgX, height: cropHeight }}
      />
      <div
        className="absolute bg-black/60 pointer-events-none"
        style={{
          left: cropLeft + cropWidth,
          top: cropTop,
          width: imgX + imgW - (cropLeft + cropWidth),
          height: cropHeight,
        }}
      />

      {/* Crop box border + rule-of-thirds grid */}
      <div
        className="absolute border border-white/90 pointer-events-none"
        style={{ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight }}
      >
        <div className="absolute inset-0">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
        </div>
      </div>

      {/* Move area (the crop region) */}
      <div
        className="absolute"
        style={{ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight, cursor: 'move' }}
        onPointerDown={(e) => handlePointerDown(e)}
      />

      {/* Resize handles */}
      {HANDLES.map((pos) => (
        <div
          key={pos}
          style={{
            position: 'absolute',
            left: cropLeft,
            top: cropTop,
            width: cropWidth,
            height: cropHeight,
            pointerEvents: 'none',
          }}
        >
          <div style={handleStyle(pos)} />
          <div
            style={{ ...hitAreaStyle(pos), pointerEvents: 'auto' }}
            onPointerDown={(e) => handlePointerDown(e, pos)}
          />
        </div>
      ))}
    </div>
  );
}
