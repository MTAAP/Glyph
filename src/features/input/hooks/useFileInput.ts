import { useAppStore } from '@/features/settings/store';
import type { SourceInfo } from '@/shared/types';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

export async function processFile(file: File): Promise<void> {
  const store = useAppStore.getState();

  if (IMAGE_TYPES.includes(file.type)) {
    const img = new Image();
    const url = URL.createObjectURL(file);

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
  } else if (VIDEO_TYPES.includes(file.type)) {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
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
