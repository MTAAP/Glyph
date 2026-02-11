export interface RenderSettings {
  outputWidth: number;
  aspectRatioCorrection: number;
  lockAspectRatio: boolean;

  enableLuminance: boolean;
  enableEdge: boolean;
  enableDithering: boolean;
  edgeThreshold: number;
  ditheringStrength: number;
  invertRamp: boolean;

  charsetPreset: string;
  customCharset: string;

  colorMode: 'mono' | 'foreground' | 'full';
  colorDepth: 8 | 16 | 256 | 'truecolor';
  monoFgColor: string;
  monoBgColor: string;

  targetFPS: number;
  playbackSpeed: number;
  frameRange: [number, number];
  loop: boolean;
}

export interface CharacterCell {
  char: string;
  fg?: [number, number, number];
  bg?: [number, number, number];
}

export type CharacterGrid = CharacterCell[][];

export interface RenderResult {
  grid: CharacterGrid;
  width: number;
  height: number;
  renderTimeMs: number;
}

export interface ExportOptions {
  format: 'txt' | 'ansi' | 'html' | 'png' | 'gif' | 'webm' | 'frames';
  ansiColorDepth?: 8 | 16 | 256 | 'truecolor';
  htmlFontSize?: number;
  htmlFontFamily?: string;
  htmlBackground?: string;
  pngFontSize?: number;
  pngBackground?: string | 'transparent';
  gifQuality?: number;
  gifLoop?: boolean;
  webmBitrate?: number;
  framesFormat?: 'txt' | 'ans';
  includeMetadata?: boolean;
}

export interface SourceInfo {
  filename: string;
  width: number;
  height: number;
  format: string;
  duration?: number;
  type: 'image' | 'video';
}

export interface WorkerRequest {
  type: 'render';
  imageData: ArrayBuffer;
  width: number;
  height: number;
  settings: RenderSettings;
  sourceWidth: number;
  sourceHeight: number;
}

export interface WorkerResponse {
  type: 'result';
  grid: CharacterGrid;
  width: number;
  height: number;
  renderTimeMs: number;
}
