import { useRef, useCallback, useEffect, useId } from 'react';
import { processFile, ACCEPTED_FILE_TYPES, revokeActiveBlobUrl } from '@/features/input/hooks/useFileInput';
import { useAppStore } from '@/features/settings/store';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { URLInput } from './URLInput';
import { cn } from '@/shared/utils/cn';

const MAX_WARN_SIZE = 200 * 1024 * 1024; // 200 MB

export function InputControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chooseFileRef = useRef<HTMLButtonElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const chooseFileId = useId();
  const clearId = useId();

  const addToast = useAppStore((s) => s.addToast);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const setSource = useAppStore((s) => s.setSource);
  const setSourceCanvas = useAppStore((s) => s.setSourceCanvas);
  const setRenderResult = useAppStore((s) => s.setRenderResult);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const setCurrentFrame = useAppStore((s) => s.setCurrentFrame);
  const setTotalFrames = useAppStore((s) => s.setTotalFrames);
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);
  const triggerFilePicker = useAppStore((s) => s.triggerFilePicker);

  // Trigger file picker when openFilePicker is called from keyboard
  useEffect(() => {
    fileInputRef.current?.click();
  }, [triggerFilePicker]);

  const nav = useSidebarNavigationOptional();

  // Register Choose File button
  useEffect(() => {
    if (!nav) return;
    const unregister = nav.register({
      id: chooseFileId,
      type: 'button',
      ref: chooseFileRef as React.RefObject<HTMLElement>,
    });
    return unregister;
  }, [nav, chooseFileId]);

  // Register Clear button (only when visible)
  useEffect(() => {
    if (!nav || !sourceInfo) return;
    const unregister = nav.register({
      id: clearId,
      type: 'button',
      ref: clearRef as React.RefObject<HTMLElement>,
    });
    return unregister;
  }, [nav, clearId, sourceInfo]);

  // Determine focus state
  const controls = nav?.getControls() ?? [];
  const chooseFileIndex = controls.findIndex((c) => c.id === chooseFileId);
  const clearIndex = controls.findIndex((c) => c.id === clearId);
  const isChooseFileFocused = focusedIndex !== null && chooseFileIndex === focusedIndex;
  const isClearFocused = focusedIndex !== null && clearIndex === focusedIndex;

  const handleChooseFileFocus = () => {
    if (chooseFileIndex !== -1) setSidebarFocusIndex(chooseFileIndex);
  };
  const handleClearFocus = () => {
    if (clearIndex !== -1) setSidebarFocusIndex(clearIndex);
  };

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
        <div className={cn('flex-1 border border-transparent', isChooseFileFocused && 'border-accent')}>
          <button
            ref={chooseFileRef}
            onClick={openFilePicker}
            onFocus={handleChooseFileFocus}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 text-xs',
              'border border-border bg-transparent',
              'hover:text-accent hover:border-accent',
              'focus:outline-none',
            )}
          >
            Choose File
          </button>
        </div>
        {sourceInfo && (
          <div className={cn('border border-transparent', isClearFocused && 'border-accent')}>
            <button
              ref={clearRef}
              onClick={clearSource}
              onFocus={handleClearFocus}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 text-xs',
                'border border-border bg-transparent',
                'hover:text-accent hover:border-accent',
                'focus:outline-none',
              )}
            >
              [X] Clear
            </button>
          </div>
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
