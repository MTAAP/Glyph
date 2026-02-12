import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { processFile } from '@/features/input/hooks/useFileInput';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

export function URLInput() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const addToast = useAppStore((s) => s.addToast);

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
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') fetchUrl();
        }}
        placeholder="Paste image URL..."
        className={cn(
          'flex-1 min-w-0 px-3 py-2 rounded-md text-sm',
          'bg-secondary border border-input',
          'focus:outline-none focus:ring-2 focus:ring-ring',
          'placeholder:text-muted-foreground',
        )}
      />
      <button
        onClick={fetchUrl}
        disabled={loading || !url.trim()}
        className={cn(
          'w-20 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium shrink-0',
          'bg-primary text-primary-foreground',
          'hover:opacity-90 transition-opacity',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
      </button>
    </div>
  );
}
