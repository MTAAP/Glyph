import { useAppStore } from '@/features/settings/store';
import { NavigableSegmented } from '@/shared/ui/NavigableSegmented';
import { NavigableSelect } from '@/shared/ui/NavigableSelect';
import { NavigableColorInput } from '@/shared/ui/NavigableColorInput';
import type { RenderSettings } from '@/shared/types';

type ColorMode = RenderSettings['colorMode'];

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'mono', label: 'Mono' },
  { value: 'foreground', label: 'FG' },
  { value: 'full', label: 'Full' },
];

const COLOR_DEPTHS = [
  { value: '8', label: '8 colors' },
  { value: '16', label: '16 colors' },
  { value: '256', label: '256 colors' },
  { value: 'truecolor', label: 'Truecolor' },
];

export function ColorControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <div className="space-y-3">
      <NavigableSegmented
        value={settings.colorMode}
        onValueChange={(v) => updateSettings({ colorMode: v })}
        options={COLOR_MODES}
      />

      <NavigableSelect
        label="Color Quantization"
        value={String(settings.colorDepth)}
        onValueChange={(v) => {
          const depth = v === 'truecolor' ? 'truecolor' : (parseInt(v, 10) as 8 | 16 | 256);
          updateSettings({ colorDepth: depth });
        }}
        options={COLOR_DEPTHS}
      />

      {settings.colorMode === 'mono' && (
        <div className="flex justify-center gap-4">
          <NavigableColorInput
            label="FG"
            value={settings.monoFgColor}
            onChange={(v) => updateSettings({ monoFgColor: v })}
          />
          <NavigableColorInput
            label="BG"
            value={settings.monoBgColor}
            onChange={(v) => updateSettings({ monoBgColor: v })}
          />
        </div>
      )}
    </div>
  );
}
