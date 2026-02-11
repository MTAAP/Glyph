import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';
import type { RenderSettings } from '@/shared/types';

type ColorMode = RenderSettings['colorMode'];

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'mono', label: 'Mono' },
  { value: 'foreground', label: 'Foreground' },
  { value: 'full', label: 'Full Color' },
];

const COLOR_DEPTHS: { value: string; label: string }[] = [
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
      {/* Segmented color mode control */}
      <div className="flex rounded-md bg-secondary p-0.5">
        {COLOR_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => updateSettings({ colorMode: mode.value })}
            className={cn(
              'flex-1 px-2 py-1.5 text-xs font-medium rounded-sm transition-colors',
              settings.colorMode === mode.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Color depth */}
      <div className="space-y-1.5">
        <span className="text-sm">Color Quantization</span>
        <Select.Root
          value={String(settings.colorDepth)}
          onValueChange={(v) => {
            const depth = v === 'truecolor' ? 'truecolor' : (parseInt(v, 10) as 8 | 16 | 256);
            updateSettings({ colorDepth: depth });
          }}
        >
          <Select.Trigger
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm',
              'bg-secondary border border-input hover:bg-accent transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring',
            )}
          >
            <Select.Value />
            <Select.Icon>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className="bg-popover border rounded-lg shadow-lg overflow-hidden z-50"
              position="popper"
              sideOffset={4}
            >
              <Select.Viewport className="p-1">
                {COLOR_DEPTHS.map((d) => (
                  <Select.Item
                    key={d.value}
                    value={d.value}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer',
                      'outline-none data-[highlighted]:bg-accent',
                    )}
                  >
                    <Select.ItemIndicator>
                      <Check className="w-3.5 h-3.5" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{d.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Mono color pickers */}
      {settings.colorMode === 'mono' && (
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="color"
              value={settings.monoFgColor}
              onChange={(e) => updateSettings({ monoFgColor: e.target.value })}
              className="w-8 h-8 rounded-md border border-input cursor-pointer"
            />
            <div>
              <span className="text-xs text-muted-foreground block">Foreground</span>
              <span className="text-xs font-mono">{settings.monoFgColor}</span>
            </div>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="color"
              value={settings.monoBgColor}
              onChange={(e) => updateSettings({ monoBgColor: e.target.value })}
              className="w-8 h-8 rounded-md border border-input cursor-pointer"
            />
            <div>
              <span className="text-xs text-muted-foreground block">Background</span>
              <span className="text-xs font-mono">{settings.monoBgColor}</span>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
