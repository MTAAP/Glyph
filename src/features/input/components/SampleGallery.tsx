import { useCallback, useState } from 'react';
import { useAppStore } from '@/features/settings/store';
import { SAMPLE_IMAGES, type SampleEntry } from '../data/samples';

function SampleCard({ sample, onSelect }: { sample: SampleEntry; onSelect: (sample: SampleEntry) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(sample)}
      className="group flex flex-col items-center gap-2 rounded border border-neutral-700 bg-neutral-900/50 p-3 text-left transition-colors hover:border-neutral-500 hover:bg-neutral-800/50"
    >
      <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded bg-neutral-800">
        {imgError ? (
          <span className="text-xs text-neutral-600 font-mono">[no preview]</span>
        ) : (
          <img
            src={sample.thumbnail}
            alt={sample.name}
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="w-full font-mono text-xs">
        <div className="text-neutral-200">{sample.name}</div>
        <div className="text-neutral-500">{sample.description}</div>
      </div>
    </button>
  );
}

export function SampleGallery() {
  const setSource = useAppStore((s) => s.setSource);
  const addToast = useAppStore((s) => s.addToast);

  const handleSelect = useCallback(
    (sample: SampleEntry) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setSource(img, null, {
          filename: sample.name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: sample.fullUrl.endsWith('.png') ? 'image/png' : 'image/jpeg',
          type: 'image',
        });
      };
      img.onerror = () => {
        addToast({ type: 'error', message: `Failed to load sample: ${sample.name}` });
      };
      img.src = sample.fullUrl;
    },
    [setSource, addToast],
  );

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-center font-mono">
        <div className="text-sm text-neutral-400">No image loaded</div>
        <div className="mt-1 text-xs text-neutral-600">
          Drop an image or pick a sample below
        </div>
      </div>
      <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
        {SAMPLE_IMAGES.map((sample) => (
          <SampleCard key={sample.name} sample={sample} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
