import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/features/settings/store';
import { DragDrop } from '@/features/input/components/DragDrop';
import { TextPreview } from '@/features/preview/components/TextPreview';
import { CanvasPreview } from '@/features/preview/components/CanvasPreview';
import { VideoTransport } from '@/features/preview/components/VideoTransport';
import { AnimationTransport } from '@/features/animation/components/AnimationTransport';
import { CropOverlay } from '@/features/crop/components/CropOverlay';
import { ZoomControls } from '@/features/preview/components/ZoomControls';
import { SourceOverlay } from '@/features/preview/components/SourceOverlay';
import { useRenderer } from '@/features/renderer/hooks/useRenderer';
import { useVideoFrames } from '@/features/renderer/hooks/useVideoFrames';
import { useAnimationLoop } from '@/features/animation/hooks/useAnimationLoop';
import { useZoom } from '@/features/preview/hooks/useZoom';
import { useFullscreen } from '@/features/preview/hooks/useFullscreen';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);

  useRenderer();
  useVideoFrames();
  const animatedGrid = useAnimationLoop();

  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const renderResult = useAppStore((s) => s.renderResult);
  const isRendering = useAppStore((s) => s.isRendering);
  const settings = useAppStore((s) => s.settings);
  const cropEnabled = useAppStore((s) => s.cropEnabled);

  const [overlayActive, setOverlayActive] = useState(false);

  const hasSource = sourceInfo !== null;
  const displayGrid = animatedGrid ?? renderResult?.grid ?? null;
  const showCrop = cropEnabled && hasSource;
  const useCanvasRenderer = settings.colorMode !== 'mono';

  // Zoom state management -- actual scale computation happens in preview components via usePreviewScale
  const zoom = useZoom();
  const fullscreen = useFullscreen(containerRef);

  const toggleOverlay = useCallback(() => setOverlayActive((prev) => !prev), []);

  // Expose toggle functions on window for keyboard handler access
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__glyphFullscreenToggle = fullscreen.toggle;
    w.__glyphOverlayToggle = toggleOverlay;
    w.__glyphZoomIn = zoom.zoomIn;
    w.__glyphZoomOut = zoom.zoomOut;
    w.__glyphZoomFit = zoom.setFit;
    return () => {
      delete w.__glyphFullscreenToggle;
      delete w.__glyphOverlayToggle;
      delete w.__glyphZoomIn;
      delete w.__glyphZoomOut;
      delete w.__glyphZoomFit;
    };
  }, [fullscreen.toggle, toggleOverlay, zoom.zoomIn, zoom.zoomOut, zoom.setFit]);

  // Show loading indicator when rendering and no result exists yet
  const showLoading = isRendering && !renderResult && hasSource;

  return (
    <div
      ref={containerRef}
      className={
        'flex-1 flex flex-col min-w-0 min-h-0 relative' +
        (fullscreen.isFullscreen ? ' bg-background' : '')
      }
    >
      <DragDrop containerRef={containerRef} />

      <ZoomControls
        mode={zoom.mode}
        zoomPercent={zoom.zoomPercent}
        onFit={zoom.setFit}
        onActualSize={zoom.setActualSize}
        onZoomIn={zoom.zoomIn}
        onZoomOut={zoom.zoomOut}
        overlayActive={overlayActive}
        onToggleOverlay={toggleOverlay}
        isFullscreen={fullscreen.isFullscreen}
        onToggleFullscreen={fullscreen.toggle}
        fullscreenSupported={fullscreen.isSupported}
        hasSource={hasSource}
      />

      {/* Preview area */}
      <div
        ref={previewAreaRef}
        className={
          'flex-1 overflow-hidden flex items-center justify-center p-4 relative' +
          (zoom.mode !== 'fit' ? ' cursor-grab active:cursor-grabbing' : '')
        }
        onWheel={zoom.containerHandlers.onWheel}
        onMouseDown={zoom.containerHandlers.onMouseDown}
      >
        {/* Empty state */}
        {!hasSource && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground text-xs uppercase tracking-wide">
            <div className="text-2xl">[^]</div>
            <p>Drop image or video to begin</p>
            <p className="text-xs normal-case tracking-normal">or use sidebar controls</p>
          </div>
        )}

        {/* Loading indicator */}
        {showLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="text-xs font-mono text-muted-foreground animate-pulse tracking-widest uppercase">
              Rendering...
            </span>
          </div>
        )}

        {/* Preview content with pan offset */}
        {hasSource && !showCrop && displayGrid && (
          <div
            style={{
              transform: zoom.mode !== 'fit'
                ? `translate(${zoom.panX}px, ${zoom.panY}px)`
                : undefined,
            }}
            className="relative"
          >
            {/* Source overlay behind preview */}
            {overlayActive && (
              <SourceOverlay
                width={sourceInfo?.width ?? 0}
                height={sourceInfo?.height ?? 0}
              />
            )}

            {useCanvasRenderer ? (
              <CanvasPreview
                grid={displayGrid}
                containerRef={previewAreaRef}
                scaleMode={zoom.mode}
                customScale={zoom.scale}
              />
            ) : (
              <TextPreview
                grid={displayGrid}
                containerRef={previewAreaRef}
                scaleMode={zoom.mode}
                customScale={zoom.scale}
              />
            )}
          </div>
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
