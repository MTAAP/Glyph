import { useAppStore } from '@/features/settings/store';

export function Footer() {
  const isRendering = useAppStore((s) => s.isRendering);
  const renderResult = useAppStore((s) => s.renderResult);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const totalFrames = useAppStore((s) => s.totalFrames);
  const settings = useAppStore((s) => s.settings);

  const status = isRendering ? 'Rendering...' : 'Ready';
  const dimensions = renderResult
    ? `${renderResult.width}\u00d7${renderResult.height}`
    : '\u2014';
  const renderTime = renderResult ? `${renderResult.renderTimeMs.toFixed(0)}ms` : '\u2014';

  return (
    <footer className="h-8 flex items-center px-4 border-t shrink-0 text-xs text-muted-foreground gap-4">
      <span>{status}</span>
      <span>{dimensions}</span>
      <span>{renderTime}</span>
      {sourceInfo?.type === 'video' && (
        <>
          <span>{settings.targetFPS} fps</span>
          <span>
            Frame {currentFrame}/{totalFrames}
          </span>
        </>
      )}
    </footer>
  );
}
