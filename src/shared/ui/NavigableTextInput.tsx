import { useEffect, useRef, useId } from 'react';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

interface NavigableTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'url';
  className?: string;
}

export function NavigableTextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
}: NavigableTextInputProps) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const nav = useSidebarNavigationOptional();
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'text',
      ref: ref as React.RefObject<HTMLElement>,
      getValue: () => value,
      // Text inputs don't have setValue - Left/Right is used for cursor navigation
    });

    return unregister;
  }, [nav, id, value]);

  // Determine if this control is focused
  const controls = nav?.getControls() ?? [];
  const myIndex = controls.findIndex((c) => c.id === id);

  // Update focus index when this element receives focus via click
  const handleFocus = () => {
    if (myIndex !== -1) {
      setSidebarFocusIndex(myIndex);
    }
  };

  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2 text-xs',
        'bg-transparent border border-border',
        'focus:outline-none focus:border-accent',
        className
      )}
    />
  );
}
