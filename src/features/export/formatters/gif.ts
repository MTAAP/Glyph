import { encode } from 'modern-gif';
import type { UnencodedFrame } from 'modern-gif';
import type { CharacterGrid } from '@/shared/types/index.ts';
import { renderGridToCanvas } from './png.ts';

export interface GifLargeFrameWarning {
  frameCount: number;
  estimatedSizeMb: number;
  estimatedProcessingTimeSec: number;
}

interface GifOptions {
  fps: number;
  quality?: number;
  loop?: boolean;
  fontSize?: number;
  fontFamily?: string;
  background?: string;
  cellSpacingX?: number;
  cellSpacingY?: number;
  onProgress?: (percent: number) => void;
  onLargeFrameWarning?: (warning: GifLargeFrameWarning) => void;
}

export function formatGif(
  frames: CharacterGrid[],
  options: GifOptions,
): Promise<Blob> {
  const fps = options.fps || 10;
  const quality = options.quality ?? 10;
  const loop = options.loop ?? true;
  const fontSize = options.fontSize ?? 14;
  const fontFamily = options.fontFamily ?? 'monospace';
  const background = options.background ?? '#1a1a1a';
  const spX = options.cellSpacingX ?? 1.0;
  const spY = options.cellSpacingY ?? 1.0;
  const padding = 10;
  const delay = Math.round(1000 / fps);

  if (frames.length === 0) {
    return Promise.resolve(new Blob([], { type: 'image/gif' }));
  }

  // Warn for large frame counts (>300 frames)
  const LARGE_FRAME_THRESHOLD = 300;
  if (frames.length > LARGE_FRAME_THRESHOLD && options.onLargeFrameWarning) {
    // Estimate ~50KB per frame at default quality, ~0.05s encoding per frame
    const estimatedSizeMb = (frames.length * 50) / 1024;
    const estimatedProcessingTimeSec = frames.length * 0.05;
    options.onLargeFrameWarning({
      frameCount: frames.length,
      estimatedSizeMb: Math.round(estimatedSizeMb * 10) / 10,
      estimatedProcessingTimeSec: Math.round(estimatedProcessingTimeSec),
    });
  }

  const rows = frames[0].length;
  const cols = rows > 0 ? frames[0][0].length : 0;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const font = `${fontSize}px ${fontFamily}`;
  ctx.font = font;
  const metrics = ctx.measureText('M');
  const charWidth = metrics.width;
  const lineHeight = fontSize * 1.2;

  const cellPitchX = charWidth * spX;
  const cellPitchY = lineHeight * spY;

  canvas.width = Math.ceil(cols * cellPitchX + 2 * padding);
  canvas.height = Math.ceil(rows * cellPitchY + 2 * padding);

  // Reset after resize
  ctx.font = font;
  ctx.textBaseline = 'top';

  const encoderFrames: UnencodedFrame[] = [];

  for (let i = 0; i < frames.length; i++) {
    renderGridToCanvas(frames[i], canvas, ctx, charWidth, lineHeight, padding, background, spX, spY);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Copy pixel data to a plain ArrayBuffer-backed view for TS 5.9 BufferSource compat
    const pixelCopy = new Uint8ClampedArray(imageData.data.length) as Uint8ClampedArray<ArrayBuffer>;
    pixelCopy.set(imageData.data);
    encoderFrames.push({
      data: pixelCopy,
      delay,
      width: canvas.width,
      height: canvas.height,
    });

    if (options.onProgress) {
      options.onProgress(Math.round(((i + 1) / frames.length) * 100));
    }
  }

  return encode({
    width: canvas.width,
    height: canvas.height,
    frames: encoderFrames,
    loopCount: loop ? 0 : -1,
    maxColors: Math.max(2, Math.min(256, 256 - (quality - 1) * 8)),
  }).then((output) => new Blob([output], { type: 'image/gif' }));
}
