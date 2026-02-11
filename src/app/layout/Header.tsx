import { Sun, Moon, Monitor, Info } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

export function Header() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const cycleTheme = () => {
    const order: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b shrink-0">
      <h1 className="text-lg font-semibold tracking-tight">Glyph</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm',
            'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
          )}
          title={`Theme: ${themeLabel}`}
        >
          <ThemeIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{themeLabel}</span>
        </button>
        <button
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm',
            'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
          )}
          title="About Glyph"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">About</span>
        </button>
      </div>
    </header>
  );
}
