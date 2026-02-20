import { useState, useEffect } from 'react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold tracking-wide uppercase">Glyph</h2>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-accent focus:outline-none"
          >
            [ESC] Close
          </button>
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

  const cycleTheme = () => {
    const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const themeLabel = theme === 'light' ? 'LIGHT' : theme === 'dark' ? 'DARK' : 'AUTO';

  return (
    <>
      <header className="h-12 flex items-center justify-between px-4 border-b shrink-0">
        <h1 className="text-sm font-bold tracking-wide uppercase">Glyph</h1>
        <div className="flex items-center gap-4 text-xs">
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
