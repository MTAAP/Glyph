import { useRef, useEffect } from 'react';
import { useAppStore } from '@/features/settings/store';

interface SourceOverlayProps {
  width: number;
  height: number;
}

/**
 * Renders the source image behind the ASCII preview at matching dimensions.
 * Displayed at 30% opacity to allow comparison with the rendered output.
 */
export function SourceOverlay({ width, height }: SourceOverlayProps) {
  const sourceImage = useAppStore((s) => s.sourceImage);
  const sourceVideo = useAppStore((s) => s.sourceVideo);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const src = sourceImage?.src ?? undefined;
  const isVideo = sourceVideo !== null;

  // Redraw video overlay canvas whenever the frame changes
  useEffect(() => {
    if (!isVideo || !sourceVideo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = sourceVideo.videoWidth || width;
    canvas.height = sourceVideo.videoHeight || height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
    }
  }, [isVideo, sourceVideo, currentFrame, width, height]);

  if (!src && !isVideo) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.3 }}
    >
      {src && (
        <img
          src={src}
          alt=""
          style={{ width, height, objectFit: 'contain' }}
          draggable={false}
        />
      )}
      {isVideo && sourceVideo && (
        <canvas
          ref={canvasRef}
          style={{ width, height }}
        />
      )}
    </div>
  );
}
