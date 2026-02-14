import { useEffect, useRef, useId } from 'react';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { useFocusVisible } from '@/shared/hooks/useFocusVisible';
import { cn } from '@/shared/utils/cn';

interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface NavigableRadioProps<T extends string> {
  name: string;
  value: T;
  onValueChange: (value: T) => void;
  options: RadioOption<T>[];
  disabled?: boolean;
}

export function NavigableRadio<T extends string>({
  name,
  value,
  onValueChange,
  options,
  disabled = false,
}: NavigableRadioProps<T>) {
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
      type: 'radio',
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

  const controls = nav?.getControls() ?? [];
  const myIndex = controls.findIndex((c) => c.id === id);
  const isFocused = focusedIndex !== null && myIndex === focusedIndex && isKeyboardFocus;

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
        'flex flex-wrap gap-3 focus:outline-none border border-transparent',
        isFocused && 'border-accent'
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn('flex items-center gap-1.5 text-xs', disabled && 'opacity-50')}
        >
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onValueChange(option.value)}
            disabled={disabled}
            className="accent-primary"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
