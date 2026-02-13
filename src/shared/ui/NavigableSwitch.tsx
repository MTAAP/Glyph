import { useEffect, useRef, useId } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { useFocusVisible } from '@/shared/hooks/useFocusVisible';
import { cn } from '@/shared/utils/cn';

interface NavigableSwitchProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function NavigableSwitch({
  label,
  checked,
  onCheckedChange,
  disabled = false,
}: NavigableSwitchProps) {
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
