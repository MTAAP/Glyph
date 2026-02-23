import { useAppStore } from '@/features/settings/store';
import { NavigableSegmented } from '@/shared/ui/NavigableSegmented';
import { NavigableSelect } from '@/shared/ui/NavigableSelect';
import { NavigableColorInput } from '@/shared/ui/NavigableColorInput';
import type { RenderSettings } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

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

const MONO_PALETTES: { name: string; fg: string; bg: string }[] = [
  { name: 'Terminal Green', fg: '#00ff00', bg: '#000000' },
  { name: 'Amber CRT', fg: '#ffb000', bg: '#000000' },
  { name: 'Paper White', fg: '#333333', bg: '#f5f5dc' },
  { name: 'Dracula', fg: '#f8f8f2', bg: '#282a36' },
  { name: 'Solarized', fg: '#839496', bg: '#002b36' },
];

export function ColorControls() {
  const colorMode = useAppStore((s) => s.settings.colorMode);
  const colorDepth = useAppStore((s) => s.settings.colorDepth);
  const monoFgColor = useAppStore((s) => s.settings.monoFgColor);
  const monoBgColor = useAppStore((s) => s.settings.monoBgColor);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const applyPalette = (fg: string, bg: string) => {
    updateSettings({ monoFgColor: fg, monoBgColor: bg });
  };

  return (
    <div className="space-y-3">
      <NavigableSegmented
        value={colorMode}
        onValueChange={(v) => updateSettings({ colorMode: v })}
        options={COLOR_MODES}
      />

      <NavigableSelect
        label="Color Quantization"
        value={String(colorDepth)}
        onValueChange={(v) => {
          const depth = v === 'truecolor' ? 'truecolor' : (parseInt(v, 10) as 8 | 16 | 256);
          updateSettings({ colorDepth: depth });
        }}
        options={COLOR_DEPTHS}
      />

      {colorMode === 'mono' && (
        <>
          <div className="space-y-1.5">
            <span className="text-xs">Palette</span>
            <div className="flex gap-1 flex-wrap">
              {MONO_PALETTES.map((palette) => {
                const isActive = monoFgColor === palette.fg && monoBgColor === palette.bg;
                return (
                  <button
                    key={palette.name}
                    onClick={() => applyPalette(palette.fg, palette.bg)}
                    title={palette.name}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 text-xs border',
                      'hover:border-accent',
                      isActive
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    <span
                      className="inline-block w-3 h-3 border border-border"
                      style={{ backgroundColor: palette.fg }}
                    />
                    <span
                      className="inline-block w-3 h-3 border border-border"
                      style={{ backgroundColor: palette.bg }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <NavigableColorInput
              label="FG"
              value={monoFgColor}
              onChange={(v) => updateSettings({ monoFgColor: v })}
            />
            <NavigableColorInput
              label="BG"
              value={monoBgColor}
              onChange={(v) => updateSettings({ monoBgColor: v })}
            />
          </div>
        </>
      )}
    </div>
  );
}
