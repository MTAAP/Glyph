import type { CharacterGrid } from '@/shared/types/index.ts';
import { renderGridToCanvas } from './png.ts';

interface WebmOptions {
  fps: number;
  bitrate?: number;
  fontSize?: number;
  fontFamily?: string;
  background?: string;
  cellSpacingX?: number;
  cellSpacingY?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function formatWebm(
  frames: CharacterGrid[],
  options: WebmOptions,
): Promise<Blob> {
  const fps = options.fps || 10;
  const bitrate = options.bitrate ?? 2_500_000;
  const fontSize = options.fontSize ?? 14;
  const fontFamily = options.fontFamily ?? 'monospace';
  const background = options.background ?? '#1a1a1a';
  const spX = options.cellSpacingX ?? 1.0;
  const spY = options.cellSpacingY ?? 1.0;
  const padding = 10;
  const frameDuration = 1000 / fps;

  if (frames.length === 0) {
    return new Blob([], { type: 'video/webm' });
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

  ctx.font = font;
  ctx.textBaseline = 'top';

  const stream = canvas.captureStream(0);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm',
    videoBitsPerSecond: bitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();

  const track = stream.getVideoTracks()[0] as MediaStreamTrack & {
    requestFrame?: () => void;
  };

  for (let i = 0; i < frames.length; i++) {
    renderGridToCanvas(frames[i], canvas, ctx, charWidth, lineHeight, padding, background, spX, spY);
    // Request a new frame capture from the stream
    if (track.requestFrame) {
      track.requestFrame();
    }
    await sleep(frameDuration);
  }

  recorder.stop();
  await stopped;

  return new Blob(chunks, { type: 'video/webm' });
}
