import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { CHARSET_PRESETS } from '@/features/settings/presets';
import { cn } from '@/shared/utils/cn';

export function PresetSelector() {
  const charsetPreset = useAppStore((s) => s.settings.charsetPreset);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">Character Set</span>
      <Select.Root
        value={charsetPreset}
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
    </div>
  );
}
