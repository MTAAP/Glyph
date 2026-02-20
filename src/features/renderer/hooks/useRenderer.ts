import { useEffect, useRef } from 'react';
import { useAppStore } from '@/features/settings/store';
import type { WorkerMessage } from '../worker/protocol';
import type { RenderSettings } from '@/shared/types';
import type { CropRect } from '@/features/crop/types';
import { sampleGrid } from '../engine/sampler';
import { applyAdjustments } from '../engine/adjustments';
import { mapToCharacters } from '../engine/mapper';
import { getActiveCharset } from '@/features/settings/presets';

const DEBOUNCE_MS = 150;
const MAX_RETRIES = 3;

// Persistent canvas for extractImageData to avoid per-render allocation
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!sharedCanvas || !sharedCtx) {
    sharedCanvas = document.createElement('canvas');
    sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true })!;
  }
  // Only resize when dimensions change
  if (sharedCanvas.width !== width || sharedCanvas.height !== height) {
    sharedCanvas.width = width;
    sharedCanvas.height = height;
  }
  return { canvas: sharedCanvas, ctx: sharedCtx };
}

function createRenderWorker(): Worker | null {
  try {
    return new Worker(new URL('../worker/render.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch {
    return null;
  }
}

function extractImageData(
  source: HTMLImageElement | HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  cropRect?: CropRect | null,
): ImageData {
  if (cropRect) {
    const sx = Math.round(cropRect.x * sourceWidth);
    const sy = Math.round(cropRect.y * sourceHeight);
    const sw = Math.round(cropRect.width * sourceWidth);
    const sh = Math.round(cropRect.height * sourceHeight);
    const { ctx } = getSharedCanvas(sw, sh);
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    return ctx.getImageData(0, 0, sw, sh);
  }

  const { ctx } = getSharedCanvas(sourceWidth, sourceHeight);
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight);
  return ctx.getImageData(0, 0, sourceWidth, sourceHeight);
}

function renderOnMainThread(
  imageData: ImageData,
  settings: RenderSettings,
  sourceWidth: number,
  sourceHeight: number,
): void {
  const start = performance.now();
  const charset = getActiveCharset(settings.charsetPreset, settings.customCharset, settings.wordSequence);
  const data = imageData.data;

  const rawSamples = sampleGrid(
    data,
    sourceWidth,
    sourceHeight,
    settings.outputWidth,
    settings.aspectRatioCorrection,
  );

  const samples = applyAdjustments(rawSamples, settings.brightness, settings.contrast, settings.saturation, settings.hueShift);

  const grid = mapToCharacters(
    samples,
    settings,
    charset,
    data,
    sourceWidth,
    sourceHeight,
  );

  const renderTimeMs = performance.now() - start;

  useAppStore.getState().setRenderResult({
    grid,
    width: samples.cols,
    height: samples.rows,
    renderTimeMs,
  });
  useAppStore.getState().setIsRendering(false);
}

export function useRenderer(): void {
  const workerRef = useRef<Worker | null>(null);
  const retriesRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingRenderRef = useRef(false);
  // Store the last worker message so it can be replayed after a crash recovery
  const lastWorkerMessageRef = useRef<{
    imageData: ArrayBuffer;
    width: number;
    settings: RenderSettings;
    sourceWidth: number;
    sourceHeight: number;
  } | null>(null);

  useEffect(() => {
    workerRef.current = createRenderWorker();
    retriesRef.current = 0;

    function handleMessage(event: MessageEvent<WorkerMessage>) {
      const msg = event.data;

      if (msg.type === 'result') {
        useAppStore.getState().setRenderResult({
          grid: msg.grid,
          width: msg.width,
          height: msg.height,
          renderTimeMs: msg.renderTimeMs,
        });
        useAppStore.getState().setIsRendering(false);
        retriesRef.current = 0;
      } else if (msg.type === 'error') {
        useAppStore.getState().addToast({
          type: 'error',
          message: `Render failed: ${msg.message}`,
        });
        useAppStore.getState().setIsRendering(false);
      }
    }

    function handleError() {
      useAppStore.getState().setIsRendering(false);

      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++;
        workerRef.current = createRenderWorker();
        if (workerRef.current) {
          workerRef.current.onmessage = handleMessage;
          workerRef.current.onerror = handleError;

          // Re-dispatch the last render request on the new worker
          const lastMsg = lastWorkerMessageRef.current;
          if (lastMsg) {
            useAppStore.getState().setIsRendering(true);
            const buffer = lastMsg.imageData.slice(0);
            workerRef.current.postMessage(
              {
                type: 'render',
                imageData: buffer,
                width: lastMsg.width,
                height: 0,
                settings: lastMsg.settings,
                sourceWidth: lastMsg.sourceWidth,
                sourceHeight: lastMsg.sourceHeight,
              },
              [buffer],
            );
          }
        }
      } else {
        useAppStore.getState().addToast({
          type: 'error',
          message: 'Render worker crashed. Falling back to main thread.',
        });
        workerRef.current = null;
      }
    }

    if (workerRef.current) {
      workerRef.current.onmessage = handleMessage;
      workerRef.current.onerror = handleError;
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const dispatch = () => {
      const state = useAppStore.getState();
      const { sourceImage: img, sourceVideo: vid, sourceInfo: info, settings: s } = state;
      const src = img ?? vid;
      if (!src || !info) return;

      const activeCrop = state.cropRect;

      let imageData: ImageData;
      try {
        imageData = extractImageData(src, info.width, info.height, activeCrop);
      } catch {
        useAppStore.getState().addToast({
          type: 'error',
          message: 'Failed to read image data from source.',
        });
        return;
      }

      const effectiveWidth = imageData.width;
      const effectiveHeight = imageData.height;

      useAppStore.getState().setIsRendering(true);

      if (workerRef.current) {
        // Store a copy for crash recovery replay before transferring the buffer
        lastWorkerMessageRef.current = {
          imageData: imageData.data.buffer.slice(0),
          width: s.outputWidth,
          settings: s,
          sourceWidth: effectiveWidth,
          sourceHeight: effectiveHeight,
        };
        // Transfer the buffer directly; imageData is not used after this point
        const buffer = imageData.data.buffer;
        workerRef.current.postMessage(
          {
            type: 'render',
            imageData: buffer,
            width: s.outputWidth,
            height: 0,
            settings: s,
            sourceWidth: effectiveWidth,
            sourceHeight: effectiveHeight,
          },
          [buffer],
        );
      } else {
        try {
          renderOnMainThread(imageData, s, effectiveWidth, effectiveHeight);
        } catch (err) {
          useAppStore.getState().addToast({
            type: 'error',
            message: `Render failed: ${err instanceof Error ? err.message : String(err)}`,
          });
          useAppStore.getState().setIsRendering(false);
        }
      }
    };

    // Trigger initial render if source is already loaded
    dispatch();

    const unsubscribe = useAppStore.subscribe((state, prev) => {
      const settingsChanged = state.settings !== prev.settings;
      const sourceChanged =
        state.sourceImage !== prev.sourceImage ||
        state.sourceVideo !== prev.sourceVideo;
      const frameChanged = state.currentFrame !== prev.currentFrame;
      const cropChanged = state.cropRect !== prev.cropRect;

      if (!settingsChanged && !sourceChanged && !frameChanged && !cropChanged) return;

      const source = state.sourceImage ?? state.sourceVideo;
      if (!source || !state.sourceInfo) return;

      clearTimeout(debounceTimerRef.current);

      if ((settingsChanged || cropChanged) && !sourceChanged) {
        pendingRenderRef.current = true;
        debounceTimerRef.current = setTimeout(() => {
          pendingRenderRef.current = false;
          dispatch();
        }, DEBOUNCE_MS);
      } else {
        dispatch();
      }
    });

    return unsubscribe;
  }, []);
}
