import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
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
  return (
    <label className="flex items-center justify-between gap-2">
      <span className={cn('text-sm', disabled && 'text-muted-foreground')}>{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'w-9 h-5 rounded-full relative transition-colors',
          'bg-input data-[state=checked]:bg-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <Switch.Thumb
          className={cn(
            'block w-4 h-4 rounded-full bg-background transition-transform',
            'translate-x-0.5 data-[state=checked]:translate-x-[18px]',
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
      </div>
      <Slider.Root
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
        className="relative flex items-center select-none touch-none h-5"
      >
        <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
          <Slider.Range className="absolute h-full rounded-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </Slider.Root>
    </div>
  );
}
