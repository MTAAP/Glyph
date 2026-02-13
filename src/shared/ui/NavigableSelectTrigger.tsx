import { useEffect, useRef, useId } from 'react';
import * as Select from '@radix-ui/react-select';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { useFocusVisible } from '@/shared/hooks/useFocusVisible';
import { cn } from '@/shared/utils/cn';

interface NavigableSelectTriggerProps {
  children: React.ReactNode;
}

export function NavigableSelectTrigger({ children }: NavigableSelectTriggerProps) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);
  const isKeyboardFocus = useFocusVisible();

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'select',
      ref: ref as React.RefObject<HTMLElement>,
      getValue: () => '',
    });

    return unregister;
  }, [nav, id]);

  const controls = nav?.getControls() ?? [];
  const myIndex = controls.findIndex((c) => c.id === id);
  const isFocused = focusedIndex !== null && myIndex === focusedIndex && isKeyboardFocus;

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
    <Select.Trigger
      ref={ref}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center justify-between w-full border px-2.5 py-1.5 text-xs',
        'bg-background hover:bg-accent transition-colors focus:outline-none',
        isFocused && 'border-accent'
      )}
    >
      {children}
    </Select.Trigger>
  );
}
