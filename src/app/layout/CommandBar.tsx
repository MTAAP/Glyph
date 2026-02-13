import { useAppStore } from '@/features/settings/store';

interface Shortcut {
  key: string;
  action: string;
  available: boolean;
}

export function CommandBar() {
  const isRendering = useAppStore((s) => s.isRendering);
  const renderResult = useAppStore((s) => s.renderResult);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const totalFrames = useAppStore((s) => s.totalFrames);
  const settings = useAppStore((s) => s.settings);

  const isVideo = sourceInfo?.type === 'video';
  const hasResult = renderResult !== null;

  const shortcuts: Shortcut[] = [
    { key: '[1-7]', action: 'Preset', available: true },
    { key: '[F]', action: 'File', available: true },
    { key: '[X]', action: 'Clear', available: sourceInfo !== null },
    { key: '[Space]', action: 'Play', available: isVideo },
    { key: '[</>]', action: 'Frame', available: isVideo },
    { key: '[C]', action: 'Copy', available: hasResult },
    { key: '[E]', action: 'Export', available: hasResult },
  ];

  const status = isRendering ? 'RENDERING' : 'READY';
  const dimensions = renderResult
    ? `${renderResult.width}\u00d7${renderResult.height}`
    : '\u2014';
  const renderTime = renderResult ? `${renderResult.renderTimeMs.toFixed(0)}ms` : '\u2014';

  return (
    <footer className="h-9 flex items-center justify-between px-4 border-t shrink-0 text-xs bg-background">
      {/* Left: Keyboard shortcuts */}
      <div className="flex items-center gap-4">
        {shortcuts
          .filter((s) => s.available)
          .map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span className="text-foreground">{s.key}</span>
              <span className="text-muted-foreground">{s.action}</span>
            </span>
          ))}
      </div>

      {/* Right: Status info */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>{status}</span>
        <span>{dimensions}</span>
        <span>{renderTime}</span>
        {isVideo && (
          <>
            <span>{settings.targetFPS}fps</span>
            <span>
              {currentFrame}/{totalFrames}
            </span>
          </>
        )}
      </div>
    </footer>
  );
}
