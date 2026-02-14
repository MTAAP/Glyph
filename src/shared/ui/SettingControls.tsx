import { useEffect, useRef, useId } from 'react';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { useFocusVisible } from '@/shared/hooks/useFocusVisible';
import { cn } from '@/shared/utils/cn';

export function SettingSwitch({
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
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
      type: 'switch',
      ref: ref as React.RefObject<HTMLElement>,
      getValue: () => checked,
      setValue: () => {
        if (!disabled) {
          onCheckedChange(!checked);
        }
      },
    });

    return unregister;
  }, [nav, id, checked, onCheckedChange, disabled]);

  const controls = nav?.getControls() ?? [];
  const myIndex = controls.findIndex((c) => c.id === id);
  const isFocused = focusedIndex !== null && myIndex === focusedIndex && isKeyboardFocus;

  const handleFocus = () => {
    if (myIndex !== -1) {
      setSidebarFocusIndex(myIndex);
    }
  };

  return (
    <label className={cn('flex items-center justify-between gap-2 border border-transparent', isFocused && 'border-accent')}>
      <span className={cn('text-xs', disabled && 'text-muted-foreground')}>{label}</span>
      <Switch.Root
        ref={ref}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        onFocus={handleFocus}
        className={cn(
          'w-10 h-5 border border-border bg-transparent relative',
          'data-[state=checked]:bg-accent/20 data-[state=checked]:border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center px-0.5',
          'focus:outline-none'
        )}
      >
        <Switch.Thumb
          className={cn(
            'block w-4 h-3.5 bg-muted-foreground',
            'data-[state=checked]:bg-accent data-[state=checked]:translate-x-[18px]'
          )}
        />
      </Switch.Root>
    </label>
  );
}

export function SettingSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);
  const isKeyboardFocus = useFocusVisible();

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
    <div className={cn('space-y-1.5 border border-transparent', isFocused && 'border-accent')}>
      <div className="flex items-center justify-between">
        <span className="text-xs">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
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
