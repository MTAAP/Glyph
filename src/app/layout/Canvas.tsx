import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { DragDrop } from '@/features/input/components/DragDrop';
import { TextPreview } from '@/features/preview/components/TextPreview';
import { CanvasPreview } from '@/features/preview/components/CanvasPreview';
import { VideoTransport } from '@/features/preview/components/VideoTransport';
import { useRenderer } from '@/features/renderer/hooks/useRenderer';
import { useVideoFrames } from '@/features/renderer/hooks/useVideoFrames';


export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  useRenderer();
  useVideoFrames();
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const renderResult = useAppStore((s) => s.renderResult);
  const settings = useAppStore((s) => s.settings);

  const hasSource = sourceInfo !== null;
  const hasResult = renderResult !== null;
  // Use CanvasPreview for color modes, TextPreview for mono
  const useCanvasRenderer = settings.colorMode !== 'mono';

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-w-0 min-h-0 relative">
      <DragDrop containerRef={containerRef} />

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {!hasSource && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Upload className="w-10 h-10" />
            <p className="text-sm">Drop an image or video here to get started</p>
          </div>
        )}

        {hasSource && hasResult && (
          useCanvasRenderer ? (
            <CanvasPreview grid={renderResult.grid} containerRef={containerRef} />
          ) : (
            <TextPreview grid={renderResult.grid} containerRef={containerRef} />
          )
        )}
      </div>

      {/* Video transport bar */}
      {sourceInfo?.type === 'video' && <VideoTransport />}
    </div>
  );
}
