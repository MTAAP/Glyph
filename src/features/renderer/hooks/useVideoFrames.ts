import { useEffect, useRef } from 'react';
import { useAppStore } from '@/features/settings/store';

export function useVideoFrames(): void {
  const rafRef = useRef<number>(0);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (state, prev) => {
        if (state.sourceVideo !== prev.sourceVideo && state.sourceVideo && state.sourceInfo?.duration) {
          const duration = state.sourceInfo.duration;
          const targetFPS = state.settings.targetFPS;
          const totalFrames = Math.ceil(duration * targetFPS);
          useAppStore.getState().setTotalFrames(totalFrames);
        }
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe(
      (state, prev) => {
        const startedPlaying = state.isPlaying && !prev.isPlaying;
        const stoppedPlaying = !state.isPlaying && prev.isPlaying;

        if (startedPlaying) {
          startPlayback();
        } else if (stoppedPlaying) {
          stopPlayback();
        }
      },
    );

    return () => {
      unsubscribe();
      stopPlayback();
    };
  }, []);

  function startPlayback() {
    lastFrameTimeRef.current = 0;

    function tick(timestamp: number) {
      const state = useAppStore.getState();
      const { sourceVideo, sourceInfo, settings, isPlaying, currentFrame, totalFrames } = state;

      if (!isPlaying || !sourceVideo || !sourceInfo?.duration) {
        return;
      }

      const targetFPS = settings.targetFPS;
      const playbackSpeed = settings.playbackSpeed;
      const frameInterval = 1000 / (targetFPS * playbackSpeed);

      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        lastFrameTimeRef.current = timestamp - (elapsed % frameInterval);

        const [rangeStart, rangeEnd] = settings.frameRange;
        const startFrame = Math.floor((rangeStart / 100) * totalFrames);
        const endFrame = Math.floor((rangeEnd / 100) * totalFrames);
        const frameCount = endFrame - startFrame;

        if (frameCount <= 0) {
          useAppStore.getState().setIsPlaying(false);
          return;
        }

        let nextFrame = currentFrame + 1;

        if (nextFrame >= endFrame) {
          if (settings.loop) {
            nextFrame = startFrame;
          } else {
            useAppStore.getState().setIsPlaying(false);
            return;
          }
        }

        // Clamp to valid range
        if (nextFrame < startFrame) {
          nextFrame = startFrame;
        }

        // Seek the video element to the correct time position
        const duration = sourceInfo.duration;
        const seekTime = (nextFrame / totalFrames) * duration;
        sourceVideo.currentTime = seekTime;

        useAppStore.getState().setCurrentFrame(nextFrame);
        // The useRenderer hook reacts to currentFrame changes and triggers a re-render
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    // Ensure we start at a valid frame within the range
    const state = useAppStore.getState();
    const [rangeStart] = state.settings.frameRange;
    const startFrame = Math.floor((rangeStart / 100) * state.totalFrames);
    if (state.currentFrame < startFrame) {
      useAppStore.getState().setCurrentFrame(startFrame);
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }
}
