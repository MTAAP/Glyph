import type { ScaleMode } from '@/features/preview/hooks/usePreviewScale';

interface ZoomControlsProps {
  mode: ScaleMode;
  zoomPercent: number;
  onFit: () => void;
  onActualSize: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  overlayActive: boolean;
  onToggleOverlay: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  fullscreenSupported: boolean;
  hasSource: boolean;
}

export function ZoomControls({
  mode,
  zoomPercent,
  onFit,
  onActualSize,
  onZoomIn,
  onZoomOut,
  overlayActive,
  onToggleOverlay,
  isFullscreen,
  onToggleFullscreen,
  fullscreenSupported,
  hasSource,
}: ZoomControlsProps) {
  if (!hasSource) return null;

  const btnBase =
    'px-1.5 py-0.5 text-xs font-mono border border-border cursor-pointer select-none ' +
    'hover:bg-accent hover:text-accent-foreground transition-colors';

  const activeBtn = btnBase + ' bg-accent text-accent-foreground';

  return (
    <div
      data-zoom-controls
      className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-card/90 border border-border px-1 py-0.5"
    >
      <button
        className={mode === 'fit' ? activeBtn : btnBase}
        onClick={onFit}
        title="Fit to view"
      >
        [Fit]
      </button>
      <button
        className={mode === '1:1' ? activeBtn : btnBase}
        onClick={onActualSize}
        title="Actual size (1:1)"
      >
        [1:1]
      </button>
      <button className={btnBase} onClick={onZoomOut} title="Zoom out">
        [-]
      </button>
      <span className="text-xs font-mono text-muted-foreground min-w-[3.5ch] text-center">
        {zoomPercent}%
      </span>
      <button className={btnBase} onClick={onZoomIn} title="Zoom in">
        [+]
      </button>

      <span className="text-border mx-0.5">|</span>

      <button
        className={overlayActive ? activeBtn : btnBase}
        onClick={onToggleOverlay}
        title="Toggle source overlay (O)"
      >
        [Src]
      </button>

      {fullscreenSupported && (
        <button
          className={isFullscreen ? activeBtn : btnBase}
          onClick={onToggleFullscreen}
          title="Toggle fullscreen (F)"
        >
          {isFullscreen ? '[Exit]' : '[Full]'}
        </button>
      )}
    </div>
  );
}
