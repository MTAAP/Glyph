import { useEffect, useRef, useId } from 'react';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { useFocusVisible } from '@/shared/hooks/useFocusVisible';
import { cn } from '@/shared/utils/cn';

interface NavigableButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function NavigableButton({
  children,
  onClick,
  disabled = false,
  className,
  title,
}: NavigableButtonProps) {
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
      type: 'button',
      ref: ref as React.RefObject<HTMLElement>,
      onClick,
    });

    return unregister;
  }, [nav, id, onClick]);

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
    <div className={cn('border border-transparent px-1', isFocused && 'border-accent')}>
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        onFocus={handleFocus}
        title={title}
        className={cn(
          'focus:outline-none',
          className
        )}
      >
        {children}
      </button>
    </div>
  );
}
