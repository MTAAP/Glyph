import { useState, useCallback } from 'react';
import { useAppStore } from '@/features/settings/store.ts';
import type { ExportOptions, CharacterGrid } from '@/shared/types/index.ts';
import { formatPlaintext } from '../formatters/plaintext.ts';
import { formatAnsi } from '../formatters/ansi.ts';
import { formatHtml } from '../formatters/html.ts';

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

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportAs = useCallback(
    async (
      format: ExportOptions['format'],
      extraOptions?: Partial<ExportOptions>,
    ) => {
      const state = useAppStore.getState();
      const { renderResult, sourceInfo, settings } = state;

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
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'gif': {
            const { formatGif } = await import('../formatters/gif.ts');
            // For single image, wrap grid as one-frame animation
            const frames: CharacterGrid[] = [grid];
            const blob = await formatGif(frames, {
              fps: settings.targetFPS,
              quality: extraOptions?.gifQuality,
              loop: extraOptions?.gifLoop,
              onProgress: setProgress,
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'webm': {
            const { formatWebm } = await import('../formatters/webm.ts');
            const frames: CharacterGrid[] = [grid];
            const blob = await formatWebm(frames, {
              fps: settings.targetFPS,
              bitrate: extraOptions?.webmBitrate,
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'frames': {
            const { formatFrameSequence } = await import(
              '../formatters/frames.ts'
            );
            const frames: CharacterGrid[] = [grid];
            const blob = await formatFrameSequence(frames, {
              format: extraOptions?.framesFormat ?? 'txt',
              includeMetadata: extraOptions?.includeMetadata,
              fps: settings.targetFPS,
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
      const { renderResult, settings } = state;

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
