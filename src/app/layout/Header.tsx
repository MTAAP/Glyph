import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';
import { Logo } from '@/shared/ui/Logo';

function AboutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80" onClick={onClose} />
      <div className="relative w-full max-w-sm border bg-card shadow-lg p-6">
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-accent focus:outline-none"
          >
            [ESC] Close
          </button>
        </div>
        <div className="mb-4">
          <Logo variant="full" />
        </div>
        <div className="space-y-3 text-xs text-muted-foreground">
          <p className="text-foreground">
            Browser-based ASCII art converter for images and video.
          </p>
          <p>
            Fully client-side, no backend. Your files never leave your browser.
          </p>
          <ul className="space-y-1">
            <li>Multiple character sets and presets</li>
            <li>Mono, foreground, and full color modes</li>
            <li>Animation effects and export</li>
            <li>PNG, GIF, WebM, HTML export</li>
          </ul>
          <div className="pt-2 border-t border-border">
            <a
              href="https://github.com/MTAAP/Glyph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              github.com/MTAAP/Glyph
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [aboutOpen, setAboutOpen] = useState(false);

  const undoSettings = useAppStore((s) => s.undoSettings);
  const redoSettings = useAppStore((s) => s.redoSettings);
  const canUndo = useAppStore((s) => s.settingsHistoryIndex > 0);
  const canRedo = useAppStore((s) => s.settingsHistoryIndex < s.settingsHistory.length - 1);

  const cycleTheme = () => {
    const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const themeLabel = theme === 'light' ? 'LIGHT' : theme === 'dark' ? 'DARK' : 'AUTO';

  const shareSettings = useCallback(async () => {
    const state = useAppStore.getState();
    const settingsJson = JSON.stringify(state.settings);
    const encoded = btoa(settingsJson);
    const url = new URL(window.location.href);
    url.searchParams.set('settings', encoded);
    
    try {
      await navigator.clipboard.writeText(url.toString());
      useAppStore.getState().addToast({ type: 'info', message: 'Share link copied to clipboard' });
    } catch {
      useAppStore.getState().addToast({ type: 'error', message: 'Failed to copy share link' });
    }
  }, []);

  useEffect(() => {
    useAppStore.getState().setCallbacks({
      shareSettings,
    });
    return () => {
      useAppStore.getState().setCallbacks({
        shareSettings: undefined,
      });
    };
  }, [shareSettings]);

  return (
    <>
      <header className="h-12 flex items-center justify-between px-4 border-b shrink-0">
        <Logo variant="compact" />
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={undoSettings}
              disabled={!canUndo}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1',
                'text-muted-foreground hover:text-accent disabled:opacity-50 disabled:pointer-events-none',
              )}
              title="Undo Settings"
            >
              <span className="text-foreground">(&larr;)</span>
              <span className="hidden sm:inline">UNDO</span>
            </button>
            <button
              onClick={redoSettings}
              disabled={!canRedo}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1',
                'text-muted-foreground hover:text-accent disabled:opacity-50 disabled:pointer-events-none',
              )}
              title="Redo Settings"
            >
              <span className="text-foreground">(&rarr;)</span>
              <span className="hidden sm:inline">REDO</span>
            </button>
          </div>
          <button
            onClick={shareSettings}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1',
              'text-muted-foreground hover:text-accent',
            )}
            title="Share Settings"
          >
            <span className="text-foreground">[S]</span>
            <span className="hidden sm:inline">SHARE</span>
          </button>
          <button
            onClick={cycleTheme}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1',
              'text-muted-foreground hover:text-accent',
            )}
            title={`Theme: ${themeLabel}`}
          >
            <span className="text-foreground">[T]</span>
            <span className="hidden sm:inline">{themeLabel}</span>
          </button>
          <button
            onClick={() => setAboutOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1',
              'text-muted-foreground hover:text-accent',
            )}
            title="About Glyph"
          >
            <span className="text-foreground">[?]</span>
            <span className="hidden sm:inline">ABOUT</span>
          </button>
        </div>
      </header>
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
