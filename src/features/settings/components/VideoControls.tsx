import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

export function VideoControls() {
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const totalFrames = useAppStore((s) => s.totalFrames);

  if (sourceInfo?.type !== 'video') return null;

  return (
    <div className="space-y-3">
      {/* Target FPS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm">Target FPS</span>
          <span className="text-xs text-muted-foreground tabular-nums">{settings.targetFPS}</span>
        </div>
        <Slider.Root
          value={[settings.targetFPS]}
          onValueChange={([v]) => updateSettings({ targetFPS: v })}
          min={1}
          max={30}
          step={1}
          className="relative flex items-center select-none touch-none h-5"
        >
          <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </Slider.Root>
      </div>

      {/* Playback Speed */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm">Playback Speed</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {settings.playbackSpeed}x
          </span>
        </div>
        <Slider.Root
          value={[settings.playbackSpeed]}
          onValueChange={([v]) => updateSettings({ playbackSpeed: v })}
          min={0.25}
          max={4}
          step={0.25}
          className="relative flex items-center select-none touch-none h-5"
        >
          <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </Slider.Root>
      </div>

      {/* Frame Range */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm">Frame Range</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {settings.frameRange[0]}% &ndash; {settings.frameRange[1]}%
          </span>
        </div>
        <Slider.Root
          value={[settings.frameRange[0], settings.frameRange[1]]}
          onValueChange={([start, end]) =>
            updateSettings({ frameRange: [start, end] })
          }
          min={0}
          max={100}
          step={1}
          minStepsBetweenThumbs={1}
          className="relative flex items-center select-none touch-none h-5"
        >
          <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </Slider.Root>
      </div>

      {/* Loop */}
      <label className="flex items-center justify-between gap-2">
        <span className="text-sm">Loop</span>
        <Switch.Root
          checked={settings.loop}
          onCheckedChange={(v) => updateSettings({ loop: v })}
          className={cn(
            'w-9 h-5 rounded-full relative transition-colors',
            'bg-input data-[state=checked]:bg-primary',
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

      <p className="text-xs text-muted-foreground">
        Frame {currentFrame} / {totalFrames}
      </p>
    </div>
  );
}
