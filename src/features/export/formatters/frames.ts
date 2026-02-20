import { zipSync } from 'fflate';
import type { CharacterGrid, RenderSettings } from '@/shared/types/index.ts';
import { formatPlaintext } from './plaintext.ts';
import { formatAnsi } from './ansi.ts';

interface FramesOptions {
  format: 'txt' | 'ans';
  includeMetadata?: boolean;
  fps?: number;
  sourceFilename?: string;
  settings?: RenderSettings;
  colorDepth?: 8 | 16 | 256 | 'truecolor';
}

export function formatFrameSequence(
  frames: CharacterGrid[],
  options: FramesOptions,
): Promise<Blob> {
  const ext = options.format === 'ans' ? '.ans' : '.txt';
  const encoder = new TextEncoder();

  const files: Record<string, Uint8Array> = {};

  for (let i = 0; i < frames.length; i++) {
    const padded = String(i + 1).padStart(4, '0');
    const filename = `frame_${padded}${ext}`;

    let content: string;
    if (options.format === 'ans') {
      content = formatAnsi(frames[i], options.colorDepth ?? 256);
    } else {
      const cols = frames[i].length > 0 ? frames[i][0].length : 0;
      const rows = frames[i].length;
      content = formatPlaintext(frames[i], { cols, rows });
    }

    files[filename] = encoder.encode(content);
  }

  if (options.includeMetadata) {
    const cols =
      frames.length > 0 && frames[0].length > 0 ? frames[0][0].length : 0;
    const rows = frames.length > 0 ? frames[0].length : 0;

    const fps = options.fps ?? 10;
    const metadata = {
      version: '1.0',
      frameCount: frames.length,
      fps,
      duration: frames.length / fps,
      resolution: { cols, rows },
      format: options.format,
      source: options.sourceFilename ?? null,
      settings: options.settings ?? null,
      generatedAt: new Date().toISOString(),
      generator: 'Glyph',
    };

    files['metadata.json'] = encoder.encode(JSON.stringify(metadata, null, 2));
  }

  const zipped = zipSync(files);
  // Copy to a plain ArrayBuffer-backed Uint8Array for TS 5.9 BlobPart compat
  const zipCopy = new Uint8Array(zipped.length) as Uint8Array<ArrayBuffer>;
  zipCopy.set(zipped);
  return Promise.resolve(new Blob([zipCopy], { type: 'application/zip' }));
}
