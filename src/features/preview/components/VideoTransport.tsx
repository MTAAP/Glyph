import * as Slider from '@radix-ui/react-slider';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoTransport() {
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const setCurrentFrame = useAppStore((s) => s.setCurrentFrame);
  const totalFrames = useAppStore((s) => s.totalFrames);
  if (sourceInfo?.type !== 'video') return null;

  const duration = sourceInfo.duration ?? 0;
  const currentTime = totalFrames > 0 ? (currentFrame / totalFrames) * duration : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t bg-background shrink-0">
      {/* Frame step back */}
      <button
        onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
        className={cn(
          'p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
        )}
        title="Previous frame"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={cn(
          'p-1.5 rounded-md text-foreground hover:bg-accent transition-colors',
        )}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>

      {/* Frame step forward */}
      <button
        onClick={() => setCurrentFrame(Math.min(totalFrames - 1, currentFrame + 1))}
        className={cn(
          'p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
        )}
        title="Next frame"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      {/* Time display */}
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {formatTime(currentTime)}
      </span>

      {/* Seek slider */}
      <Slider.Root
        value={[currentFrame]}
        onValueChange={([v]) => setCurrentFrame(v)}
        min={0}
        max={Math.max(1, totalFrames - 1)}
        step={1}
        className="relative flex-1 flex items-center select-none touch-none h-5"
      >
        <Slider.Track className="relative grow h-1 rounded-full bg-secondary">
          <Slider.Range className="absolute h-full rounded-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb className="block w-3.5 h-3.5 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </Slider.Root>

      {/* Duration */}
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
}
