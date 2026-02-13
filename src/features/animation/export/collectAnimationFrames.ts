import type { CharacterGrid, AnimationSettings } from '@/shared/types';
import type { AnimationContext } from '../engine/types';
import { applyEffectPipeline } from '../engine/pipeline';
import '../engine/effects';

/**
 * Generates animation frames by applying the effect pipeline at each time step.
 * Returns one CharacterGrid per frame across the full cycle duration.
 */
export function collectAnimationFrames(
  baseGrid: CharacterGrid,
  animation: AnimationSettings,
  onProgress?: (percent: number) => void,
): CharacterGrid[] {
  if (!animation.enabled || animation.effects.length === 0) {
    return [baseGrid];
  }

  const totalFrames = Math.ceil(animation.fps * animation.cycleDuration);
  const frames: CharacterGrid[] = [];
  const rows = baseGrid.length;
  const cols = rows > 0 ? baseGrid[0].length : 0;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / totalFrames;

    const ctx: AnimationContext = {
      t,
      frame: i,
      rows,
      cols,
      cycleDuration: animation.cycleDuration,
    };

    frames.push(applyEffectPipeline(baseGrid, animation.effects, ctx));

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalFrames) * 100));
    }
  }

  // For pingpong, append reversed frames (minus first and last to avoid duplicates)
  if (animation.loopMode === 'pingpong' && frames.length > 2) {
    const reversed = frames.slice(1, -1).reverse();
    frames.push(...reversed);
  }

  return frames;
}
