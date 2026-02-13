import { useEffect, useRef, useId } from 'react';
import * as Select from '@radix-ui/react-select';
import { useSidebarNavigationOptional } from '@/features/settings/context/SidebarNavigationContext';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface NavigableSelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function NavigableSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder,
}: NavigableSelectProps) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const nav = useSidebarNavigationOptional();
  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);

  useEffect(() => {
    if (!nav) return;

    const unregister = nav.register({
      id,
      type: 'select',
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
  const isFocused = focusedIndex !== null && myIndex === focusedIndex;

  // Update focus index when this element receives focus via click
  const handleFocus = () => {
    if (myIndex !== -1) {
      setSidebarFocusIndex(myIndex);
    }
  };

  // Prevent Radix from opening dropdown on arrow keys - let our navigation handle it
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  return (
    <div className={cn('space-y-1.5')}>
      {label && <span className="text-xs">{label}</span>}
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger
          ref={ref}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-xs',
            'bg-transparent border border-border hover:text-accent',
            'focus:outline-none focus:border-accent',
            isFocused && 'border-accent'
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <span className="text-muted-foreground">[v]</span>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="bg-popover border border-border overflow-hidden z-50"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer',
                    'outline-none data-[highlighted]:text-accent data-[highlighted]:bg-accent/10'
                  )}
                >
                  <Select.ItemIndicator>
                    <span>[*]</span>
                  </Select.ItemIndicator>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  {option.description && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
