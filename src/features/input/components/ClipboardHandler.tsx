import { useEffect } from 'react';
import { processFile } from '@/features/input/hooks/useFileInput';

export function ClipboardHandler() {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      // Handle pasted image files
      for (const item of e.clipboardData.items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            return;
          }
        }
      }

      // Handle pasted URLs
      const text = e.clipboardData.getData('text/plain').trim();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        // Only intercept if not typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        e.preventDefault();
        fetch(text)
          .then((res) => res.blob())
          .then((blob) => {
            const filename = text.split('/').pop() || 'pasted';
            const file = new File([blob], filename, { type: blob.type });
            return processFile(file);
          })
          .catch(() => {
            // Silently fail for non-image URLs
          });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return null;
}
