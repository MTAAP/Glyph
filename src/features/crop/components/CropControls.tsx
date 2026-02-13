import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';
import type { AspectRatioPreset } from '@/features/crop/types';

const ASPECT_RATIOS: { value: AspectRatioPreset; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
  { value: '3:2', label: '3:2' },
];

export function CropControls() {
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const cropEnabled = useAppStore((s) => s.cropEnabled);
  const cropRect = useAppStore((s) => s.cropRect);
  const cropAspectRatio = useAppStore((s) => s.cropAspectRatio);
  const setCropEnabled = useAppStore((s) => s.setCropEnabled);
  const setCropAspectRatio = useAppStore((s) => s.setCropAspectRatio);
  const resetCrop = useAppStore((s) => s.resetCrop);

  if (!sourceInfo) return null;

  const cropW = cropRect ? Math.round(cropRect.width * sourceInfo.width) : sourceInfo.width;
  const cropH = cropRect ? Math.round(cropRect.height * sourceInfo.height) : sourceInfo.height;

  return (
    <div className="space-y-3">
      {/* Enable toggle */}
      <label className="flex items-center justify-between gap-2">
        <span className="text-xs">Activate Crop Tool</span>
        <Switch.Root
          checked={cropEnabled}
          onCheckedChange={setCropEnabled}
          className={cn(
            'w-10 h-5 border border-border bg-transparent relative',
            'data-[state=checked]:bg-accent/20 data-[state=checked]:border-accent',
            'flex items-center px-0.5',
            'focus:outline-none'
          )}
        >
          <Switch.Thumb
            className={cn(
              'block w-4 h-3.5 bg-muted-foreground',
              'data-[state=checked]:bg-accent data-[state=checked]:translate-x-[18px]'
            )}
          />
        </Switch.Root>
      </label>

      {cropEnabled && (
        <>
          {/* Aspect ratio select */}
          <div className="space-y-1.5">
            <span className="text-xs">Aspect Ratio</span>
            <Select.Root
              value={cropAspectRatio}
              onValueChange={(v) => setCropAspectRatio(v as AspectRatioPreset)}
            >
              <Select.Trigger
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs',
                  'bg-secondary border border-input hover:bg-accent transition-colors',
                  'focus:outline-none',
                )}
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className="bg-popover border shadow-lg overflow-hidden z-50"
                  position="popper"
                  sideOffset={4}
                >
                  <Select.Viewport className="p-1">
                    {ASPECT_RATIOS.map((r) => (
                      <Select.Item
                        key={r.value}
                        value={r.value}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer',
                          'outline-none data-[highlighted]:bg-accent',
                        )}
                      >
                        <Select.ItemIndicator>
                          <Check className="w-3.5 h-3.5" />
                        </Select.ItemIndicator>
                        <Select.ItemText>{r.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Crop dimensions + reset */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {cropW} &times; {cropH} px
            </span>
            <button
              onClick={resetCrop}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs',
                'text-muted-foreground hover:text-foreground transition-colors',
              )}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
