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

  const themeLabel = theme === 'light' ? 'LIGHT' : theme === 'dark' ? 'DARK' : 'AUTO';

  return (
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
  );
}
