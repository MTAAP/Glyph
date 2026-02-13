import { useEffect, useRef, useId } from 'react';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';
import type { LoopMode } from '@/shared/types';

interface NavigableLoopModeProps {
  value: LoopMode;
  onValueChange: (value: LoopMode) => void;
}

export function NavigableLoopMode({ value, onValueChange }: NavigableLoopModeProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);

  const modes: LoopMode[] = ['loop', 'pingpong', 'once'];

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'select',
      ref: ref as React.RefObject<HTMLElement>,
      getValue: () => value,
      setValue: (delta) => {
        const currentIndex = modes.indexOf(value);
        if (currentIndex === -1) return;

        const newIndex = Math.max(0, Math.min(modes.length - 1, currentIndex + delta));
        if (newIndex !== currentIndex) {
          onValueChange(modes[newIndex]);
        }
      },
      options: modes,
    });

    return unregister;
  }, [nav, id, value, onValueChange]);

  const controls = nav?.getControls() ?? [];
  const myIndex = controls.findIndex((c) => c.id === id);
  const isFocused = focusedIndex !== null && myIndex === focusedIndex;

  const handleFocus = () => {
    if (myIndex !== -1) {
      setSidebarFocusIndex(myIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs">Loop Mode</span>
      <div
        ref={ref}
        tabIndex={0}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={cn('flex gap-1', isFocused && 'border-accent border rounded')}
      >
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => onValueChange(mode)}
            className={cn(
              'flex-1 px-2 py-1 text-xs border transition-colors focus:outline-none',
              value === mode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent',
            )}
          >
            {mode === 'pingpong' ? 'Ping-pong' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
