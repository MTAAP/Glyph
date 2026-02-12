import { Play, Pause } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

export function AnimationTransport() {
  const animation = useAppStore((s) => s.animation);
  const animationPlaying = useAppStore((s) => s.animationPlaying);
  const setAnimationPlaying = useAppStore((s) => s.setAnimationPlaying);

  if (!animation.enabled) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t bg-background shrink-0">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Animation</span>
      <button
        onClick={() => setAnimationPlaying(!animationPlaying)}
        className={cn(
          'p-1.5 rounded-md text-foreground hover:bg-accent transition-colors',
        )}
        title={animationPlaying ? 'Pause animation' : 'Play animation'}
      >
        {animationPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {animation.cycleDuration}s cycle / {animation.fps} fps / {animation.loopMode}
      </span>
    </div>
  );
}
