import { useEffect, useRef, useId } from 'react';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { useFocusVisible } from '@/shared/hooks/useFocusVisible';
import { cn } from '@/shared/utils/cn';

interface NavigableColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function NavigableColorInput({
  label,
  value,
  onChange,
}: NavigableColorInputProps) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);
  const isKeyboardFocus = useFocusVisible();

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'color',
      ref: ref as React.RefObject<HTMLElement>,
      getValue: () => value,
      // Color inputs don't have setValue - Left/Right is skipped for them
    });

    return unregister;
  }, [nav, id, value]);

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
    <label className={cn('flex items-center gap-2 border border-transparent', isFocused && 'border-accent')}>
      <input
        ref={ref}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        className="w-6 h-6 border border-border cursor-pointer bg-transparent focus:outline-none"
      />
      <div>
        <span className="text-xs text-muted-foreground block">{label}</span>
        <span className="text-xs">{value}</span>
      </div>
    </label>
  );
}
