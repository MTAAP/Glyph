import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '@/features/settings/store';
import type { CharacterGrid } from '@/shared/types';
import type { AnimationContext } from '../engine/types';
import { applyEffectPipeline } from '../engine/pipeline';
import '../engine/effects'; // Register all effects

export function useAnimationLoop(): CharacterGrid | null {
  const animation = useAppStore((s) => s.animation);
  const animationPlaying = useAppStore((s) => s.animationPlaying);
  const renderResult = useAppStore((s) => s.renderResult);

  const [liveGrid, setLiveGrid] = useState<CharacterGrid | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const baseGrid = renderResult?.grid ?? null;
  const effectsActive = animation.enabled && animation.effects.length > 0;

  const computeFrame = useCallback(
    (t: number): CharacterGrid | null => {
      if (!baseGrid || !effectsActive) return null;

      const rows = baseGrid.length;
      const cols = rows > 0 ? baseGrid[0].length : 0;

      const ctx: AnimationContext = {
        t,
        frame: Math.floor(t * animation.fps * animation.cycleDuration),
        rows,
        cols,
        cycleDuration: animation.cycleDuration,
      };

      return applyEffectPipeline(baseGrid, animation.effects, ctx);
    },
    [baseGrid, effectsActive, animation],
  );

  // Static first frame for paused state (no effect — computed synchronously)
  const pausedFrame = useMemo(() => {
    if (!effectsActive || animationPlaying) return null;
    return computeFrame(0);
  }, [effectsActive, animationPlaying, computeFrame]);

  // rAF loop for playing state
  useEffect(() => {
    if (!effectsActive || !animationPlaying) {
      return;
    }

    const frameInterval = 1000 / animation.fps;
    startTimeRef.current = performance.now();
    lastFrameTimeRef.current = 0;
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;

      // Throttle to target fps
      if (elapsed - lastFrameTimeRef.current < frameInterval) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      lastFrameTimeRef.current = elapsed;

      const elapsedSec = elapsed / 1000;
      const cycleDuration = animation.cycleDuration;
      let t: number;

      if (animation.loopMode === 'loop') {
        t = (elapsedSec / cycleDuration) % 1;
      } else if (animation.loopMode === 'pingpong') {
        const phase = (elapsedSec / cycleDuration) % 2;
        t = phase <= 1 ? phase : 2 - phase;
      } else {
        // 'once'
        t = Math.min(elapsedSec / cycleDuration, 1);
        if (t >= 1) {
          useAppStore.getState().setAnimationPlaying(false);
        }
      }

      setLiveGrid(computeFrame(t));
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [effectsActive, animationPlaying, animation, computeFrame]);

  // Priority: playing animation > paused first frame > null (disabled)
  if (animationPlaying && liveGrid) return liveGrid;
  if (pausedFrame) return pausedFrame;
  return null;
}
