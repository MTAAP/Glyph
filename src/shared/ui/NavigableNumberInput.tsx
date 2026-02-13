import { useEffect, useRef, useId } from 'react';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

interface NavigableNumberInputProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

export function NavigableNumberInput({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
}: NavigableNumberInputProps) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'number',
      ref: ref as React.RefObject<HTMLElement>,
      getValue: () => value,
      setValue: (delta) => {
        const newValue = Math.max(min, Math.min(max, value + delta * step));
        onValueChange(newValue);
      },
      step,
      min,
      max,
    });

    return unregister;
  }, [nav, id, value, onValueChange, min, max, step]);

  // Determine if this control is focused
  const controls = nav?.getControls() ?? [];
  const myIndex = controls.findIndex((c) => c.id === id);
  const isFocused = focusedIndex !== null && myIndex === focusedIndex;

  // Update focus index when this element receives focus via click
  const handleFocus = () => {
    if (myIndex !== -1) {
      setSidebarFocusIndex(myIndex);
    }
  };

  return (
    <div className={cn('flex items-center justify-between border border-transparent', isFocused && 'border-accent')}>
      <span className="text-xs">{label}</span>
      <input
        ref={ref}
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= min && v <= max) {
            onValueChange(v);
          }
        }}
        onFocus={handleFocus}
        min={min}
        max={max}
        className="w-16 text-right text-xs bg-transparent border border-border px-2 py-1 tabular-nums outline-none focus:border-accent"
      />
    </div>
  );
}
