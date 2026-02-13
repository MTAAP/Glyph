import { useRef } from 'react';
import { useAppStore } from '@/features/settings/store';
import { DragDrop } from '@/features/input/components/DragDrop';
import { TextPreview } from '@/features/preview/components/TextPreview';
import { CanvasPreview } from '@/features/preview/components/CanvasPreview';
import { VideoTransport } from '@/features/preview/components/VideoTransport';
import { AnimationTransport } from '@/features/animation/components/AnimationTransport';
import { CropOverlay } from '@/features/crop/components/CropOverlay';
import { useRenderer } from '@/features/renderer/hooks/useRenderer';
import { useVideoFrames } from '@/features/renderer/hooks/useVideoFrames';
import { useAnimationLoop } from '@/features/animation/hooks/useAnimationLoop';


export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  useRenderer();
  useVideoFrames();
  const animatedGrid = useAnimationLoop();
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const renderResult = useAppStore((s) => s.renderResult);
  const settings = useAppStore((s) => s.settings);
  const cropEnabled = useAppStore((s) => s.cropEnabled);

  const hasSource = sourceInfo !== null;
  const displayGrid = animatedGrid ?? renderResult?.grid ?? null;
  const showCrop = cropEnabled && hasSource;
  // Use CanvasPreview for color modes, TextPreview for mono
  const useCanvasRenderer = settings.colorMode !== 'mono';

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-w-0 min-h-0 relative">
      <DragDrop containerRef={containerRef} />

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
        {!hasSource && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-xs uppercase tracking-wide">
            <div className="text-2xl">[↑]</div>
            <p>Drop image or video to begin</p>
            <p className="text-xs normal-case tracking-normal">or use sidebar controls</p>
          </div>
        )}

        {hasSource && !showCrop && displayGrid && (
          useCanvasRenderer ? (
            <CanvasPreview grid={displayGrid} containerRef={containerRef} />
          ) : (
            <TextPreview grid={displayGrid} containerRef={containerRef} />
          )
        )}

        {showCrop && <CropOverlay />}
      </div>

      {/* Video transport bar */}
      {sourceInfo?.type === 'video' && <VideoTransport />}
      {/* Animation transport bar */}
      <AnimationTransport />
    </div>
  );
}
