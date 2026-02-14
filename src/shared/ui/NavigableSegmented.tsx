import { useEffect, useRef, useId } from 'react';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { useFocusVisible } from '@/shared/hooks/useFocusVisible';
import { cn } from '@/shared/utils/cn';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface NavigableSegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentOption<T>[];
}

export function NavigableSegmented<T extends string>({
  value,
  onValueChange,
  options,
}: NavigableSegmentedProps<T>) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);
  const isKeyboardFocus = useFocusVisible();

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'segmented',
      ref: ref as React.RefObject<HTMLElement>,
      getValue: () => value,
      setValue: (delta) => {
        const currentIndex = options.findIndex((o) => o.value === value);
        if (currentIndex === -1) return;

        const newIndex = Math.max(0, Math.min(options.length - 1, currentIndex + delta));
        if (newIndex !== currentIndex) {
          onValueChange(options[newIndex].value);
        }
      },
      options: options.map((o) => o.value),
    });

    return unregister;
  }, [nav, id, value, onValueChange, options]);

  // Determine if this control is focused
  const controls = nav?.getControls() ?? [];
  const myIndex = controls.findIndex((c) => c.id === id);
  const isFocused = focusedIndex !== null && myIndex === focusedIndex && isKeyboardFocus;

  // Update focus index when this element receives focus via click
  const handleFocus = () => {
    if (myIndex !== -1) {
      setSidebarFocusIndex(myIndex);
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onFocus={handleFocus}
      className={cn(
        'flex border-2 border-border focus:outline-none',
        isFocused && 'border-accent'
      )}
    >
      {options.map((option, i) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          tabIndex={-1}
          className={cn(
            'flex-1 px-2 py-1.5 text-xs',
            i > 0 && 'border-l border-border',
            value === option.value
              ? 'bg-accent/20 text-accent'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
