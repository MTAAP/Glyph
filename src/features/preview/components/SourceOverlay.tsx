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

  const src = sourceImage?.src ?? undefined;
  // For video, we use the video element's poster or capture from the video
  const isVideo = sourceVideo !== null;

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
          ref={(canvas) => {
            if (!canvas || !sourceVideo) return;
            canvas.width = sourceVideo.videoWidth || width;
            canvas.height = sourceVideo.videoHeight || height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
            }
          }}
          style={{ width, height, objectFit: 'contain' }}
        />
      )}
    </div>
  );
}
