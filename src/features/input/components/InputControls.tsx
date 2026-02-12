import { useRef, useCallback } from 'react';
import { FolderOpen, X } from 'lucide-react';
import { processFile, ACCEPTED_FILE_TYPES, revokeActiveBlobUrl } from '@/features/input/hooks/useFileInput';
import { useAppStore } from '@/features/settings/store';
import { URLInput } from './URLInput';
import { cn } from '@/shared/utils/cn';

const MAX_WARN_SIZE = 200 * 1024 * 1024; // 200 MB

export function InputControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useAppStore((s) => s.addToast);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const setSource = useAppStore((s) => s.setSource);
  const setSourceCanvas = useAppStore((s) => s.setSourceCanvas);
  const setRenderResult = useAppStore((s) => s.setRenderResult);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const setCurrentFrame = useAppStore((s) => s.setCurrentFrame);
  const setTotalFrames = useAppStore((s) => s.setTotalFrames);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        addToast({ type: 'error', message: `Unsupported file type: ${file.type}` });
        return;
      }
      if (file.size > MAX_WARN_SIZE) {
        addToast({
          type: 'warning',
          message: `Large file (${(file.size / 1024 / 1024).toFixed(0)} MB) may be slow to process.`,
        });
      }
      await processFile(file);
    },
    [addToast],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [handleFile],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearSource = useCallback(() => {
    revokeActiveBlobUrl();
    setIsPlaying(false);
    setSource(null, null, null);
    setSourceCanvas(null);
    setRenderResult(null);
    setCurrentFrame(0);
    setTotalFrames(0);
  }, [setSource, setSourceCanvas, setRenderResult, setIsPlaying, setCurrentFrame, setTotalFrames]);

  return (
    <div className="space-y-2">
      <URLInput />
      <div className="flex gap-2">
        <button
          onClick={openFilePicker}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
            'bg-secondary text-secondary-foreground',
            'hover:bg-secondary/80 transition-colors',
          )}
        >
          <FolderOpen className="w-4 h-4" />
          Choose File
        </button>
        {sourceInfo && (
          <button
            onClick={clearSource}
            className={cn(
              'w-20 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium shrink-0',
              'bg-primary text-primary-foreground',
              'hover:opacity-90 transition-opacity',
            )}
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(',')}
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
