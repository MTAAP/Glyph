import { useRef, useCallback } from 'react';
import { FolderOpen, X } from 'lucide-react';
import { processFile } from '@/features/input/hooks/useFileInput';
import { useAppStore } from '@/features/settings/store';
import { URLInput } from './URLInput';
import { cn } from '@/shared/utils/cn';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];
const MAX_WARN_SIZE = 200 * 1024 * 1024; // 200 MB

export function InputControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useAppStore((s) => s.addToast);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const setSource = useAppStore((s) => s.setSource);
  const setSourceCanvas = useAppStore((s) => s.setSourceCanvas);
  const setRenderResult = useAppStore((s) => s.setRenderResult);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
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
    setSource(null, null, null);
    setSourceCanvas(null);
    setRenderResult(null);
  }, [setSource, setSourceCanvas, setRenderResult]);

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
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
