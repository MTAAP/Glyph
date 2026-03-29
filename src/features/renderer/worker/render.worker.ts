import type { WorkerRequest } from '../../../shared/types';
import type { WorkerError } from './protocol';
import { sampleGrid } from '../engine/sampler';
import { applyAdjustments } from '../engine/adjustments';
import { mapToCharacters } from '../engine/mapper';
import { getActiveCharset } from '../../settings/presets';

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.type !== 'render') return;

  try {
    const start = performance.now();

    const imageData = new Uint8ClampedArray(request.imageData);
    const { settings, width, sourceWidth, sourceHeight, measuredPalette } = request;

    const charset = getActiveCharset(settings.charsetPreset, settings.customCharset, settings.wordSequence);

    const rawSamples = sampleGrid(
      imageData,
      sourceWidth,
      sourceHeight,
      width,
      settings.aspectRatioCorrection,
    );

    const samples = applyAdjustments(rawSamples, settings.brightness, settings.contrast, settings.saturation, settings.hueShift);

    const grid = mapToCharacters(
      samples,
      settings,
      charset,
      imageData,
      sourceWidth,
      sourceHeight,
      measuredPalette,
    );

    const renderTimeMs = performance.now() - start;

    self.postMessage({
      type: 'result',
      grid,
      width: samples.cols,
      height: samples.rows,
      renderTimeMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'error', message } satisfies WorkerError);
  }
};
