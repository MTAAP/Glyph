import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/features/settings/store.ts';
import type { ExportOptions, CharacterGrid } from '@/shared/types/index.ts';
import { formatPlaintext, formatMarkdownCodeBlock } from '../formatters/plaintext.ts';
import { formatAnsi } from '../formatters/ansi.ts';
import { formatHtml } from '../formatters/html.ts';
import { collectVideoFrames } from '../collectFrames.ts';
import { collectAnimationFrames } from '@/features/animation/export/collectAnimationFrames.ts';
import { applyEffectPipeline } from '@/features/animation/engine/pipeline.ts';
import '@/features/animation/engine/effects/index.ts';

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
    svg: '.svg',
    png: '.png',
    gif: '.gif',
    webm: '.webm',
    frames: '.zip',
    'animated-html': '.html',
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
  const { sourceVideo, sourceInfo, settings, totalFrames, cropRect, animation } = state;

  // Image source
  if (sourceInfo?.type !== 'video' || !sourceVideo || !sourceInfo.duration) {
    if (animation.enabled && animation.effects.length > 0) {
      return collectAnimationFrames(currentGrid, animation, onProgress);
    }
    return [currentGrid];
  }

  // Video source — pause playback to prevent seeking conflicts
  const wasPlaying = state.isPlaying;
  if (wasPlaying) {
    useAppStore.getState().setIsPlaying(false);
  }

  try {
    const videoFrames = await collectVideoFrames(
      sourceVideo,
      sourceInfo.width,
      sourceInfo.height,
      settings,
      totalFrames,
      sourceInfo.duration,
      onProgress,
      cropRect,
    );

    // Apply animation effects to each video frame if enabled
    if (animation.enabled && animation.effects.length > 0) {
      return videoFrames.map((frame, i) => {
        const t = videoFrames.length > 1 ? i / (videoFrames.length - 1) : 0;
        const rows = frame.length;
        const cols = rows > 0 ? frame[0].length : 0;
        return applyEffectPipeline(frame, animation.effects, {
          t,
          frame: i,
          rows,
          cols,
          cycleDuration: animation.cycleDuration,
        });
      });
    }

    return videoFrames;
  } finally {
    if (wasPlaying) {
      useAppStore.getState().setIsPlaying(true);
    }
  }
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const exportingRef = useRef(false);

  const exportAs = useCallback(
    async (
      format: ExportOptions['format'],
      extraOptions?: Partial<ExportOptions>,
    ) => {
      if (exportingRef.current) return;

      const state = useAppStore.getState();
      const { renderResult, sourceInfo, settings, cellSpacingX, cellSpacingY } = state;

      if (!renderResult) return;

      exportingRef.current = true;
      setIsExporting(true);
      setProgress(0);

      try {
        const grid = renderResult.grid;
        const filename = filenameForFormat(
          sourceInfo?.filename ?? 'glyph-export',
          format,
        );

        // Shared flag: animation export when animation is active on a non-video source
        const isAnimationExport = state.animation.enabled && state.animation.effects.length > 0
          && (sourceInfo?.type !== 'video' || !sourceInfo.duration);
        const effectiveFps = isAnimationExport
          ? state.animation.fps
          : settings.targetFPS * settings.playbackSpeed;

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

          case 'svg': {
            const { formatSvg } = await import('../formatters/svg.ts');
            const svg = formatSvg(grid, {
              fontSize: extraOptions?.svgFontSize,
              fontFamily: extraOptions?.svgFontFamily,
              background: extraOptions?.svgBackground,
              cellSpacingX,
              cellSpacingY,
            });
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            triggerDownload(blob, filename);
            break;
          }

          case 'png': {
            const { formatPng } = await import('../formatters/png.ts');
            const blob = await formatPng(grid, {
              fontSize: extraOptions?.pngFontSize,
              fontFamily: extraOptions?.pngFontFamily,
              padding: extraOptions?.pngPadding,
              background: extraOptions?.pngBackground,
              cellSpacingX,
              cellSpacingY,
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'gif': {
            const { formatGif } = await import('../formatters/gif.ts');
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
              onLargeFrameWarning: (w) => {
                useAppStore.getState().addToast({
                  type: 'warning',
                  message: `Large GIF: ${w.frameCount} frames (~${w.estimatedSizeMb} MB, ~${w.estimatedProcessingTimeSec}s to encode)`,
                });
              },
            });
            triggerDownload(blob, filename);
            break;
          }

          case 'webm': {
            const { formatWebm } = await import('../formatters/webm.ts');
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

          case 'animated-html': {
            const { formatAnimatedHtml } = await import(
              '@/features/animation/export/formatAnimatedHtml.ts'
            );
            const html = formatAnimatedHtml(grid, state.animation, {
              fontSize: extraOptions?.htmlFontSize,
              fontFamily: extraOptions?.htmlFontFamily,
              background: extraOptions?.htmlBackground,
              cellSpacingX,
              cellSpacingY,
            });
            const blob = new Blob([html], { type: 'text/html' });
            triggerDownload(blob, filename);
            break;
          }
        }

        setProgress(100);
        // Brief delay so the user sees 100% before the bar disappears
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Export failed';
        useAppStore.getState().addToast({ type: 'error', message });
        setProgress(0);
      } finally {
        exportingRef.current = false;
        setIsExporting(false);
      }
    },
    [],
  );

  const copyToClipboard = useCallback(
    async (
      format: 'txt' | 'ansi' | 'html' | 'markdown',
      extraOptions?: Partial<ExportOptions>,
    ) => {
      const state = useAppStore.getState();
      const { renderResult, sourceInfo, settings, cellSpacingX, cellSpacingY } = state;

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
        case 'markdown':
          text = formatMarkdownCodeBlock(grid, {
            cols: renderResult.width,
            rows: renderResult.height,
            sourceFilename: sourceInfo?.filename,
            charsetName: settings.charsetPreset,
            modeName: settings.colorMode,
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
