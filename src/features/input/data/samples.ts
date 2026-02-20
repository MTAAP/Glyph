export interface SampleEntry {
  name: string;
  thumbnail: string;
  fullUrl: string;
  description: string;
}

/**
 * Sample images for the gallery onboarding experience.
 * Images are stored in public/samples/ — add actual optimized images there.
 * Thumbnails use the same URL (browser handles scaling via CSS).
 */
export const SAMPLE_IMAGES: SampleEntry[] = [
  {
    name: 'Portrait',
    thumbnail: '/samples/portrait.jpg',
    fullUrl: '/samples/portrait.jpg',
    description: 'Human face — great for luminance mapping',
  },
  {
    name: 'Landscape',
    thumbnail: '/samples/landscape.jpg',
    fullUrl: '/samples/landscape.jpg',
    description: 'Nature scene with depth and tonal range',
  },
  {
    name: 'High Contrast',
    thumbnail: '/samples/high-contrast.jpg',
    fullUrl: '/samples/high-contrast.jpg',
    description: 'Bold graphic with sharp edges — ideal for edge detection',
  },
  {
    name: 'Logo',
    thumbnail: '/samples/logo.png',
    fullUrl: '/samples/logo.png',
    description: 'Text and shapes — clean ASCII outlines',
  },
  {
    name: 'Pixel Art',
    thumbnail: '/samples/pixel-art.png',
    fullUrl: '/samples/pixel-art.png',
    description: 'Low-res sprite — try braille mode for detail',
  },
  {
    name: 'Photo',
    thumbnail: '/samples/photo.jpg',
    fullUrl: '/samples/photo.jpg',
    description: 'Full-color photograph — works with all color modes',
  },
];
