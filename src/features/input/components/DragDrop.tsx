import { useState, useCallback, useRef } from 'react';
import { processFile } from '@/features/input/hooks/useFileInput';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];
const MAX_WARN_SIZE = 200 * 1024 * 1024; // 200 MB

export function DragDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const dragCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useAppStore((s) => s.addToast);
  const sourceInfo = useAppStore((s) => s.sourceInfo);

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

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current++;
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCountRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [handleFile],
  );

  // Only show the click-to-upload overlay when no source is loaded
  if (!sourceInfo) {
    return (
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={onFileChange}
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/5 border border-dashed border-accent m-4">
            <div className="flex flex-col items-center gap-2 text-accent">
              <span className="text-2xl">[ + ]</span>
              <span className="text-xs uppercase tracking-wide">Drop file here</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // When source is loaded, still allow drag-and-drop overlay on top
  return (
    <>
      <div
        className={cn(
          'absolute inset-0 z-20 transition-opacity',
          isDragging ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-accent/5 border border-dashed border-accent m-4">
          <div className="flex flex-col items-center gap-2 text-accent">
            <span className="text-2xl">[ + ]</span>
            <span className="text-xs uppercase tracking-wide">Drop file here</span>
          </div>
        </div>
      </div>
      {/* Invisible drag enter listener over the canvas */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ pointerEvents: isDragging ? 'none' : undefined }}
        onDragEnter={onDragEnter}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={onFileChange}
      />
    </>
  );
}
