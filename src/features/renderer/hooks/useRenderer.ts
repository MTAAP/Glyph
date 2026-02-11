import { useEffect, useRef } from 'react';
import { useAppStore } from '@/features/settings/store';
import type { WorkerMessage } from '../worker/protocol';
import type { RenderSettings } from '@/shared/types';
import { sampleGrid } from '../engine/sampler';
import { mapToCharacters } from '../engine/mapper';
import { getActiveCharset } from '@/features/settings/presets';

const DEBOUNCE_MS = 150;
const MAX_RETRIES = 3;

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
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
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
  const charset = getActiveCharset(settings.charsetPreset, settings.customCharset);
  const data = imageData.data;

  const samples = sampleGrid(
    data,
    sourceWidth,
    sourceHeight,
    settings.outputWidth,
    settings.aspectRatioCorrection,
  );

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
      const { sourceImage: img, sourceVideo: vid, sourceInfo: info, settings: s } =
        useAppStore.getState();
      const src = img ?? vid;
      if (!src || !info) return;

      const sourceWidth = info.width;
      const sourceHeight = info.height;

      let imageData: ImageData;
      try {
        imageData = extractImageData(src, sourceWidth, sourceHeight);
      } catch {
        useAppStore.getState().addToast({
          type: 'error',
          message: 'Failed to read image data from source.',
        });
        return;
      }

      useAppStore.getState().setIsRendering(true);

      if (workerRef.current) {
        const buffer = imageData.data.buffer.slice(0);
        workerRef.current.postMessage(
          {
            type: 'render',
            imageData: buffer,
            width: s.outputWidth,
            height: 0,
            settings: s,
            sourceWidth,
            sourceHeight,
          },
          [buffer],
        );
      } else {
        try {
          renderOnMainThread(imageData, s, sourceWidth, sourceHeight);
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

      if (!settingsChanged && !sourceChanged && !frameChanged) return;

      const source = state.sourceImage ?? state.sourceVideo;
      if (!source || !state.sourceInfo) return;

      clearTimeout(debounceTimerRef.current);

      if (settingsChanged && !sourceChanged) {
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
