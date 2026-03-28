import { useAppStore } from '@/features/settings/store';
import { NavigableSlider } from '@/shared/ui/NavigableSlider';
import { NavigableSelect } from '@/shared/ui/NavigableSelect';
import { NavigableSwitch } from '@/shared/ui/NavigableSwitch';
import { VARIABLE_TYPE_FONTS, VARIABLE_TYPE_COLOR_PRESETS } from '@/shared/types';
import type { VariableTypeFont, VariableTypeColorPreset } from '@/shared/types';

export function RenderSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const isBraille = settings.charsetPreset === 'braille';
  const isWordCycle = settings.charsetPreset === 'word' && settings.wordMode === 'cycle';
  const showFullControls = !isBraille && !isWordCycle;

  return (
    <div className="space-y-3">
      <NavigableSlider
        label="Brightness"
        value={settings.brightness}
        onValueChange={(v) => updateSettings({ brightness: v })}
        min={-100}
        max={100}
      />
      <NavigableSlider
        label="Contrast"
        value={settings.contrast}
        onValueChange={(v) => updateSettings({ contrast: v })}
        min={-100}
        max={100}
      />
      <NavigableSlider
        label="Saturation"
        value={settings.saturation}
        onValueChange={(v) => updateSettings({ saturation: v })}
        min={0}
        max={200}
      />
      <NavigableSlider
        label="Hue Shift"
        value={settings.hueShift}
        onValueChange={(v) => updateSettings({ hueShift: v })}
        min={0}
        max={360}
        formatValue={(v) => `${v}\u00b0`}
      />
      {showFullControls && (
        <>
          <NavigableSwitch
            label="Luminance"
            checked={settings.enableLuminance}
            onCheckedChange={(v) => updateSettings({ enableLuminance: v })}
          />
          <div>
            <NavigableSwitch
              label="Edge Detection"
              checked={settings.enableEdge}
              onCheckedChange={(v) => updateSettings({ enableEdge: v })}
              disabled={settings.enableDithering}
            />
            {settings.enableDithering && (
              <p className="text-xs text-muted-foreground mt-1 pl-1">
                Disable Dithering to enable this option.
              </p>
            )}
          </div>
          {settings.enableEdge && (
            <NavigableSlider
              label="Edge Threshold"
              value={settings.edgeThreshold}
              onValueChange={(v) => updateSettings({ edgeThreshold: v })}
              min={0}
              max={255}
            />
          )}
          <div>
            <NavigableSwitch
              label="Dithering"
              checked={settings.enableDithering}
              onCheckedChange={(v) => updateSettings({ enableDithering: v })}
              disabled={settings.enableEdge}
            />
            {settings.enableEdge && (
              <p className="text-xs text-muted-foreground mt-1 pl-1">
                Disable Edge Detection to enable this option.
              </p>
            )}
          </div>
          {settings.enableDithering && (
            <NavigableSlider
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
        <NavigableSlider
          label="Visibility Threshold"
          value={settings.wordThreshold}
          onValueChange={(v) => updateSettings({ wordThreshold: v })}
          min={0}
          max={255}
        />
      )}
      {showFullControls && (
        <>
          <NavigableSwitch
            label="Variable Typography"
            checked={settings.enableVariableType}
            onCheckedChange={(v) => updateSettings({ enableVariableType: v })}
          />
          {settings.enableVariableType && (
            <>
              <NavigableSwitch
                label="  + Italic"
                checked={settings.variableTypeItalic}
                onCheckedChange={(v) => updateSettings({ variableTypeItalic: v })}
              />
              <NavigableSwitch
                label="  + Opacity"
                checked={settings.variableTypeOpacity}
                onCheckedChange={(v) => updateSettings({ variableTypeOpacity: v })}
              />
              <NavigableSwitch
                label="  + Proportional"
                checked={settings.variableTypeProportional}
                onCheckedChange={(v) => updateSettings({ variableTypeProportional: v })}
              />
              {settings.variableTypeProportional && (
                <NavigableSelect
                  label="  Font"
                  value={settings.variableTypeFont}
                  onValueChange={(v) => updateSettings({ variableTypeFont: v as VariableTypeFont })}
                  options={Object.keys(VARIABLE_TYPE_FONTS).map((font) => ({
                    value: font,
                    label: font,
                  }))}
                />
              )}
              <NavigableSelect
                label="  Color Preset"
                value={settings.variableTypeColorPreset}
                onValueChange={(v) => updateSettings({ variableTypeColorPreset: v as VariableTypeColorPreset })}
                options={[
                  { value: 'default', label: 'Default' },
                  ...Object.keys(VARIABLE_TYPE_COLOR_PRESETS).map((preset) => ({
                    value: preset,
                    label: preset.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
                  })),
                ]}
              />
            </>
          )}
        </>
      )}
      <NavigableSwitch
        label="Invert"
        checked={settings.invertRamp}
        onCheckedChange={(v) => updateSettings({ invertRamp: v })}
      />
    </div>
  );
}
