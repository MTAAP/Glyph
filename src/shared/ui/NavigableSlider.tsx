import { useEffect, useRef, useId } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

interface NavigableSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
}

export function NavigableSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  formatValue = (v) => String(v),
}: NavigableSliderProps) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'slider',
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

  // Prevent up/down arrow keys from changing slider value - only allow left/right
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  return (
    <div className={cn('space-y-1.5 border border-transparent', isFocused && 'border-accent')}>
      <div className="flex items-center justify-between">
        <span className="text-xs">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{formatValue(value)}</span>
      </div>
      <Slider.Root
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
        className="relative flex items-center select-none touch-none h-5"
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      >
        <Slider.Track className="relative grow h-1 bg-border">
          <Slider.Range className="absolute h-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb
          ref={ref}
          className="block w-3 h-3 bg-accent focus:outline-none"
        />
      </Slider.Root>
    </div>
  );
}
