import * as Slider from '@radix-ui/react-slider';
import { useAppStore } from '@/features/settings/store';
import { NavigableSlider } from '@/shared/ui/NavigableSlider';
import { NavigableSwitch } from '@/shared/ui/NavigableSwitch';

export function VideoControls() {
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const targetFPS = useAppStore((s) => s.settings.targetFPS);
  const playbackSpeed = useAppStore((s) => s.settings.playbackSpeed);
  const frameRange = useAppStore((s) => s.settings.frameRange);
  const loop = useAppStore((s) => s.settings.loop);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const totalFrames = useAppStore((s) => s.totalFrames);

  if (sourceInfo?.type !== 'video') return null;

  return (
    <div className="space-y-3">
      <NavigableSlider
        label="Target FPS"
        value={targetFPS}
        onValueChange={(v) => updateSettings({ targetFPS: v })}
        min={1}
        max={30}
        step={1}
      />

      <NavigableSlider
        label="Playback Speed"
        value={playbackSpeed}
        onValueChange={(v) => updateSettings({ playbackSpeed: v })}
        min={0.25}
        max={4}
        step={0.25}
        formatValue={(v) => `${v}x`}
      />

      {/* Frame Range - dual thumb slider, kept as-is */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs">Frame Range</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {frameRange[0]}% &ndash; {frameRange[1]}%
          </span>
        </div>
        <Slider.Root
          value={[frameRange[0], frameRange[1]]}
          onValueChange={([start, end]) =>
            updateSettings({ frameRange: [start, end] })
          }
          min={0}
          max={100}
          step={1}
          minStepsBetweenThumbs={1}
          className="relative flex items-center select-none touch-none h-5"
        >
          <Slider.Track className="relative grow h-1 bg-border">
            <Slider.Range className="absolute h-full bg-accent" />
          </Slider.Track>
          <Slider.Thumb className="block w-3 h-3 bg-accent focus:outline-none focus:ring-1 focus:ring-accent" />
          <Slider.Thumb className="block w-3 h-3 bg-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </Slider.Root>
      </div>

      <NavigableSwitch
        label="Loop"
        checked={loop}
        onCheckedChange={(v) => updateSettings({ loop: v })}
      />

      <p className="text-xs text-muted-foreground">
        Frame {currentFrame} / {totalFrames}
      </p>
    </div>
  );
}
