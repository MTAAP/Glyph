import { useAppStore } from '@/features/settings/store';
import { CHARSET_PRESETS } from '@/features/settings/presets';
import { NavigableSelect } from '@/shared/ui/NavigableSelect';

export function PresetSelector() {
  const charsetPreset = useAppStore((s) => s.settings.charsetPreset);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const options = [
    ...CHARSET_PRESETS.map((preset) => ({
      value: preset.key,
      label: preset.name,
      description: preset.description,
    })),
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-1.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">Character Set</span>
      <NavigableSelect
        value={charsetPreset}
        onValueChange={(v) => updateSettings({ charsetPreset: v })}
        options={options}
      />
    </div>
  );
}
