import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

function SettingSwitch({
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

function SettingSlider({
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

export function RenderSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const isBraille = settings.charsetPreset === 'braille';
  const isWordCycle = settings.charsetPreset === 'word' && settings.wordMode === 'cycle';
  const showFullControls = !isBraille && !isWordCycle;

  return (
    <div className="space-y-3">
      <SettingSlider
        label="Brightness"
        value={settings.brightness}
        onValueChange={(v) => updateSettings({ brightness: v })}
        min={-100}
        max={100}
      />
      <SettingSlider
        label="Contrast"
        value={settings.contrast}
        onValueChange={(v) => updateSettings({ contrast: v })}
        min={-100}
        max={100}
      />
      {showFullControls && (
        <>
          <SettingSwitch
            label="Luminance"
            checked={settings.enableLuminance}
            onCheckedChange={(v) => updateSettings({ enableLuminance: v })}
          />
          <SettingSwitch
            label="Edge Detection"
            checked={settings.enableEdge}
            onCheckedChange={(v) => updateSettings({ enableEdge: v })}
            disabled={settings.enableDithering}
          />
          <SettingSwitch
            label="Dithering"
            checked={settings.enableDithering}
            onCheckedChange={(v) => updateSettings({ enableDithering: v })}
            disabled={settings.enableEdge}
          />
          {settings.enableEdge && (
            <SettingSlider
              label="Edge Threshold"
              value={settings.edgeThreshold}
              onValueChange={(v) => updateSettings({ edgeThreshold: v })}
              min={0}
              max={255}
            />
          )}
          {settings.enableDithering && (
            <SettingSlider
              label="Dithering Strength"
              value={settings.ditheringStrength}
              onValueChange={(v) => updateSettings({ ditheringStrength: v })}
              min={0}
              max={100}
            />
          )}
        </>
      )}
      {isWordCycle && (
        <SettingSlider
          label="Visibility Threshold"
          value={settings.wordThreshold}
          onValueChange={(v) => updateSettings({ wordThreshold: v })}
          min={0}
          max={255}
        />
      )}
      <SettingSwitch
        label="Invert"
        checked={settings.invertRamp}
        onCheckedChange={(v) => updateSettings({ invertRamp: v })}
      />
    </div>
  );
}
