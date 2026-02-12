import { useState, useCallback } from 'react';
import { useAppStore } from '@/features/settings/store.ts';
import type { ExportOptions, CharacterGrid } from '@/shared/types/index.ts';
import { formatPlaintext } from '../formatters/plaintext.ts';
import { formatAnsi } from '../formatters/ansi.ts';
import { formatHtml } from '../formatters/html.ts';
import { collectVideoFrames } from '../collectFrames.ts';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function filenameForFormat(
  base: string,
  format: ExportOptions['format'],
): string {
  const stem = base.replace(/\.[^.]+$/, '') || 'glyph-export';
  const extMap: Record<string, string> = {
    txt: '.txt',
    ansi: '.ans',
    html: '.html',
    png: '.png',
    gif: '.gif',
    webm: '.webm',
    frames: '.zip',
  };
  return `${stem}${extMap[format]}`;
}

/**
 * Returns all frames for video sources (by seeking + rendering each frame),
 * or wraps the current grid in an array for image sources.
 */
async function getFrames(
  currentGrid: CharacterGrid,
  state: ReturnType<typeof useAppStore.getState>,
  onProgress?: (percent: number) => void,
): Promise<CharacterGrid[]> {
  const { sourceVideo, sourceInfo, settings, totalFrames, cropRect } = state;

  if (sourceInfo?.type !== 'video' || !sourceVideo || !sourceInfo.duration) {
    return [currentGrid];
  }

  // Pause playback to prevent seeking conflicts
  const wasPlaying = state.isPlaying;
  if (wasPlaying) {
    useAppStore.getState().setIsPlaying(false);
  }

  try {
    return await collectVideoFrames(
      sourceVideo,
      sourceInfo.width,
      sourceInfo.height,
      settings,
      totalFrames,
      sourceInfo.duration,
      onProgress,
      cropRect,
    );
  } finally {
    if (wasPlaying) {
      useAppStore.getState().setIsPlaying(true);
    }
  }
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportAs = useCallback(
    async (
      format: ExportOptions['format'],
      extraOptions?: Partial<ExportOptions>,
    ) => {
      const state = useAppStore.getState();
      const { renderResult, sourceInfo, settings, cellSpacingX, cellSpacingY } = state;

      if (!renderResult) return;

      setIsExporting(true);
      setProgress(0);

      try {
        const grid = renderResult.grid;
        const filename = filenameForFormat(
          sourceInfo?.filename ?? 'glyph-export',
          format,
        );

        switch (format) {
          case 'txt': {
            const text = formatPlaintext(grid, {
              includeMetadata: extraOptions?.includeMetadata,
              sourceFilename: sourceInfo?.filename,
              sourceWidth: sourceInfo?.width,
              sourceHeight: sourceInfo?.height,
              cols: renderResult.width,
              rows: renderResult.height,
              charsetName: settings.charsetPreset,
              modeName: settings.colorMode,
            });
            const blob = new Blob([text], { type: 'text/plain' });
            triggerDownload(blob, filename);
            break;
          }

          case 'ansi': {
            const depth = extraOptions?.ansiColorDepth ?? settings.colorDepth;
            const text = formatAnsi(grid, depth);
            const blob = new Blob([text], { type: 'text/plain' });
            triggerDownload(blob, filename);
            break;
          }

          case 'html': {
            const text = formatHtml(grid, {
              fontSize: extraOptions?.htmlFontSize,
              fontFamily: extraOptions?.htmlFontFamily,
              background: extraOptions?.htmlBackground,
              cellSpacingX,
              cellSpacingY,
            });
            const blob = new Blob([text], { type: 'text/html' });
            triggerDownload(blob, filename);
            break;
          }

          case 'png': {
            const { formatPng } = await import('../formatters/png.ts');
            const blob = await formatPng(grid, {
              fontSize: extraOptions?.pngFontSize,
              background: extraOptions?.pngBackground,
              cellSpacingX,
              cellSpacingY,
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'gif': {
            const { formatGif } = await import('../formatters/gif.ts');
            const effectiveFps = settings.targetFPS * settings.playbackSpeed;
            const gifFrames = await getFrames(grid, state, (p) =>
              setProgress(Math.round(p * 0.8)),
            );
            const blob = await formatGif(gifFrames, {
              fps: effectiveFps,
              quality: extraOptions?.gifQuality,
              loop: extraOptions?.gifLoop,
              cellSpacingX,
              cellSpacingY,
              onProgress: (p) => setProgress(80 + Math.round(p * 0.2)),
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'webm': {
            const { formatWebm } = await import('../formatters/webm.ts');
            const effectiveFps = settings.targetFPS * settings.playbackSpeed;
            const webmFrames = await getFrames(grid, state, setProgress);
            const blob = await formatWebm(webmFrames, {
              fps: effectiveFps,
              bitrate: extraOptions?.webmBitrate,
              cellSpacingX,
              cellSpacingY,
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'frames': {
            const { formatFrameSequence } = await import(
              '../formatters/frames.ts'
            );
            const effectiveFps = settings.targetFPS * settings.playbackSpeed;
            const seqFrames = await getFrames(grid, state, setProgress);
            const blob = await formatFrameSequence(seqFrames, {
              format: extraOptions?.framesFormat ?? 'txt',
              includeMetadata: extraOptions?.includeMetadata,
              fps: effectiveFps,
              sourceFilename: sourceInfo?.filename,
              settings,
            });
            triggerDownload(blob, filename);
            break;
          }
        }

        setProgress(100);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Export failed';
        useAppStore.getState().addToast({ type: 'error', message });
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  const copyToClipboard = useCallback(
    async (
      format: 'txt' | 'ansi' | 'html',
      extraOptions?: Partial<ExportOptions>,
    ) => {
      const state = useAppStore.getState();
      const { renderResult, settings, cellSpacingX, cellSpacingY } = state;

      if (!renderResult) return;

      const grid = renderResult.grid;
      let text: string;

      switch (format) {
        case 'txt':
          text = formatPlaintext(grid, {
            cols: renderResult.width,
            rows: renderResult.height,
          });
          break;
        case 'ansi':
          text = formatAnsi(
            grid,
            extraOptions?.ansiColorDepth ?? settings.colorDepth,
          );
          break;
        case 'html':
          text = formatHtml(grid, {
            fontSize: extraOptions?.htmlFontSize,
            fontFamily: extraOptions?.htmlFontFamily,
            background: extraOptions?.htmlBackground,
            cellSpacingX,
            cellSpacingY,
          });
          break;
      }

      try {
        await navigator.clipboard.writeText(text);
        useAppStore
          .getState()
          .addToast({ type: 'info', message: 'Copied to clipboard' });
      } catch {
        useAppStore
          .getState()
          .addToast({ type: 'error', message: 'Failed to copy to clipboard' });
      }
    },
    [],
  );

  return { exportAs, copyToClipboard, isExporting, progress };
}
