import { useAppStore } from '@/features/settings/store';
import type { SourceInfo } from '@/shared/types';

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

let activeBlobUrl: string | null = null;

/** Revoke any previously created blob URL to prevent memory leaks. */
export function revokeActiveBlobUrl(): void {
  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }
}

function trackBlobUrl(url: string): string {
  revokeActiveBlobUrl();
  activeBlobUrl = url;
  return url;
}

export async function processFile(file: File): Promise<void> {
  const store = useAppStore.getState();

  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    const img = new Image();
    const url = trackBlobUrl(URL.createObjectURL(file));

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });

    const info: SourceInfo = {
      filename: file.name,
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: file.type,
      type: 'image',
    };

    store.setSource(img, null, info);
  } else if (ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    const video = document.createElement('video');
    const url = trackBlobUrl(URL.createObjectURL(file));
    video.preload = 'auto';

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = url;
    });

    const info: SourceInfo = {
      filename: file.name,
      width: video.videoWidth,
      height: video.videoHeight,
      format: file.type,
      duration: video.duration,
      type: 'video',
    };

    store.setSource(null, video, info);
    store.setTotalFrames(Math.floor(video.duration * store.settings.targetFPS));
    store.setCurrentFrame(0);
  } else {
    store.addToast({ type: 'error', message: `Unsupported file type: ${file.type}` });
  }
}
