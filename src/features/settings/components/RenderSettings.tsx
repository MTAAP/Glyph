import { useAppStore } from '@/features/settings/store';
import { SettingSwitch, SettingSlider } from '@/shared/ui/SettingControls';

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
