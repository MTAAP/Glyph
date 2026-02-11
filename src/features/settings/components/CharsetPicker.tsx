import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { CHARSET_PRESETS, getActiveCharset } from '@/features/settings/presets';
import { cn } from '@/shared/utils/cn';

export function CharsetPicker() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const activeChars = getActiveCharset(settings.charsetPreset, settings.customCharset);
  const isCustom = settings.charsetPreset === 'custom';

  return (
    <div className="space-y-3">
      <Select.Root
        value={settings.charsetPreset}
        onValueChange={(v) => updateSettings({ charsetPreset: v })}
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
              {CHARSET_PRESETS.map((preset) => (
                <Select.Item
                  key={preset.key}
                  value={preset.key}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer',
                    'outline-none data-[highlighted]:bg-accent',
                  )}
                >
                  <Select.ItemIndicator>
                    <Check className="w-3.5 h-3.5" />
                  </Select.ItemIndicator>
                  <Select.ItemText>{preset.name}</Select.ItemText>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {preset.description}
                  </span>
                </Select.Item>
              ))}
              <Select.Item
                value="custom"
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer',
                  'outline-none data-[highlighted]:bg-accent',
                )}
              >
                <Select.ItemIndicator>
                  <Check className="w-3.5 h-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>Custom</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {isCustom && (
        <input
          type="text"
          value={settings.customCharset}
          onChange={(e) => updateSettings({ customCharset: e.target.value })}
          placeholder="Enter characters light to dark..."
          className={cn(
            'w-full px-3 py-2 rounded-md text-sm',
            'bg-secondary border border-input',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
      )}

      {/* Density preview strip */}
      <div className="overflow-hidden rounded-md bg-secondary p-2">
        <div
          className="font-mono text-xs tracking-widest text-center break-all leading-tight"
          title="Character density preview"
        >
          {activeChars === 'braille' ? '\u2800\u2801\u2803\u2807\u280f\u281f\u283f\u287f\u28ff' : activeChars}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {activeChars === 'braille'
          ? 'Braille mode (256 patterns)'
          : `${activeChars.length} characters`}
      </p>
    </div>
  );
}
