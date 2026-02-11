import type { CharacterGrid, RenderSettings } from '@/shared/types';
import { sampleGrid } from '@/features/renderer/engine/sampler';
import { mapToCharacters } from '@/features/renderer/engine/mapper';
import { getActiveCharset } from '@/features/settings/presets';

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      reject(new Error('Video seek timed out'));
    }, 5000);

    const onSeeked = () => {
      clearTimeout(timeout);
      resolve();
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = time;
  });
}

function renderFrame(
  imageData: ImageData,
  settings: RenderSettings,
  sourceWidth: number,
  sourceHeight: number,
): CharacterGrid {
  const charset = getActiveCharset(settings.charsetPreset, settings.customCharset);
  const samples = sampleGrid(
    imageData.data,
    sourceWidth,
    sourceHeight,
    settings.outputWidth,
    settings.aspectRatioCorrection,
  );
  return mapToCharacters(
    samples,
    settings,
    charset,
    imageData.data,
    sourceWidth,
    sourceHeight,
  );
}

/**
 * Iterates through a video's frame range, rendering each frame to a
 * CharacterGrid. Seeks the video element directly without touching the store,
 * so the preview/playback state is unaffected.
 */
export async function collectVideoFrames(
  video: HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  settings: RenderSettings,
  totalFrames: number,
  duration: number,
  onProgress?: (percent: number) => void,
): Promise<CharacterGrid[]> {
  const [rangeStart, rangeEnd] = settings.frameRange;
  const startFrame = Math.floor((rangeStart / 100) * totalFrames);
  const endFrame = Math.floor((rangeEnd / 100) * totalFrames);
  const frameCount = endFrame - startFrame;

  if (frameCount <= 0) return [];

  const frames: CharacterGrid[] = [];

  // Reuse a single canvas for all frame extractions
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  for (let i = startFrame; i < endFrame; i++) {
    const seekTime = (i / totalFrames) * duration;
    await seekVideo(video, seekTime);

    ctx.drawImage(video, 0, 0, sourceWidth, sourceHeight);
    const imageData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);

    const grid = renderFrame(imageData, settings, sourceWidth, sourceHeight);
    frames.push(grid);

    if (onProgress) {
      onProgress(Math.round(((i - startFrame + 1) / frameCount) * 100));
    }
  }

  return frames;
}
