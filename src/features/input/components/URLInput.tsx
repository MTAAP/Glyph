import { useState, useCallback, useEffect, useRef, useId } from 'react';
import { processFile } from '@/features/input/hooks/useFileInput';
import { useAppStore } from '@/features/settings/store';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { cn } from '@/shared/utils/cn';

export function URLInput() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const addToast = useAppStore((s) => s.addToast);
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);

  const inputId = useId();
  const buttonId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nav = useSidebarNavigationOptional();

  // Register URL input
  useEffect(() => {
    if (!nav) return;
    const unregister = nav.register({
      id: inputId,
      type: 'text',
      ref: inputRef as React.RefObject<HTMLElement>,
      getValue: () => url,
    });
    return unregister;
  }, [nav, inputId, url]);

  // Register Fetch button
  useEffect(() => {
    if (!nav) return;
    const unregister = nav.register({
      id: buttonId,
      type: 'button',
      ref: buttonRef as React.RefObject<HTMLElement>,
    });
    return unregister;
  }, [nav, buttonId]);

  // Determine focus state
  const controls = nav?.getControls() ?? [];
  const inputIndex = controls.findIndex((c) => c.id === inputId);
  const buttonIndex = controls.findIndex((c) => c.id === buttonId);
  const isInputFocused = focusedIndex !== null && inputIndex === focusedIndex;
  const isButtonFocused = focusedIndex !== null && buttonIndex === focusedIndex;

  const handleInputFocus = () => {
    if (inputIndex !== -1) setSidebarFocusIndex(inputIndex);
  };
  const handleButtonFocus = () => {
    if (buttonIndex !== -1) setSidebarFocusIndex(buttonIndex);
  };

  const fetchUrl = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const response = await fetch(trimmed);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const filename = trimmed.split('/').pop() || 'downloaded';
      const file = new File([blob], filename, { type: blob.type });
      await processFile(file);
      setUrl('');
    } catch (err) {
      const message =
        err instanceof TypeError
          ? 'Failed to fetch URL. This may be a CORS issue.'
          : `Failed to fetch: ${err instanceof Error ? err.message : 'Unknown error'}`;
      addToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [url, addToast]);

  return (
    <div className="flex gap-2">
      <div className={cn('flex-1 min-w-0 border border-transparent', isInputFocused && 'border-accent')}>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') fetchUrl();
          }}
          onFocus={handleInputFocus}
          placeholder="Paste image URL..."
          className={cn(
            'w-full px-3 py-2 text-xs',
            'bg-transparent border border-border',
            'focus:outline-none',
            'placeholder:text-muted-foreground',
          )}
        />
      </div>
      <div className={cn('border border-transparent', isButtonFocused && 'border-accent')}>
        <button
          ref={buttonRef}
          onClick={fetchUrl}
          onFocus={handleButtonFocus}
          disabled={loading || !url.trim()}
          className={cn(
            'px-3 py-2 text-xs shrink-0',
            'border border-border bg-transparent',
            'hover:text-accent hover:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none',
          )}
        >
          {loading ? '...' : 'Fetch'}
        </button>
      </div>
    </div>
  );
}
