export interface CharsetPreset {
  name: string;
  key: string;
  chars: string;
  description: string;
}

export const CHARSET_PRESETS: CharsetPreset[] = [
  {
    key: 'classic',
    name: 'Classic',
    chars: ' .:-=+*#%@',
    description: 'General purpose, high compatibility',
  },
  {
    key: 'extended',
    name: 'Extended',
    chars: " .',:;!~-_+<>i!lI?/\\|()1{}[]rcvunxzjftLCJUOQoc#MW&8%B@$",
    description: 'Fine detail',
  },
  {
    key: 'blocks',
    name: 'Blocks',
    chars: ' ░▒▓█',
    description: 'Bold, graphic look',
  },
  {
    key: 'braille',
    name: 'Braille',
    chars: 'braille',
    description: 'Ultra-high resolution (2x4 dot grid per character)',
  },
  {
    key: 'minimal',
    name: 'Minimal',
    chars: ' .#',
    description: 'High contrast, simple',
  },
  {
    key: 'alphanumeric',
    name: 'Alphanumeric',
    chars: ' .oO0@#',
    description: 'Readable, familiar',
  },
];

export const DEFAULT_CHARSET = 'classic';

export function getCharsetByKey(key: string): CharsetPreset | undefined {
  return CHARSET_PRESETS.find((p) => p.key === key);
}

export function getActiveCharset(preset: string, custom: string): string {
  if (preset === 'custom') return custom;
  if (preset === 'braille') return 'braille';
  const found = getCharsetByKey(preset);
  return found ? found.chars : CHARSET_PRESETS[0].chars;
}
