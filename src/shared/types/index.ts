export type CycleDirection = 'ltr' | 'rtl' | 'ttb' | 'reverse';

export interface RenderSettings {
  outputWidth: number;
  aspectRatioCorrection: number;
  lockAspectRatio: boolean;

  brightness: number;
  contrast: number;
  saturation: number;
  hueShift: number;

  enableLuminance: boolean;
  enableEdge: boolean;
  enableDithering: boolean;
  edgeThreshold: number;
  ditheringStrength: number;
  invertRamp: boolean;

  charsetPreset: string;
  customCharset: string;
  wordSequence: string;
  wordMode: 'cycle' | 'density';
  wordThreshold: number;
  cycleDirection: CycleDirection;

  enableVariableType: boolean;
  variableTypeItalic: boolean;
  variableTypeOpacity: boolean;
  variableTypeProportional: boolean;

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
  weight?: number;
  italic?: boolean;
  opacity?: number;
}

export type CharacterGrid = CharacterCell[][];

export interface RenderResult {
  grid: CharacterGrid;
  width: number;
  height: number;
  renderTimeMs: number;
}

export interface ExportOptions {
  format: 'txt' | 'ansi' | 'html' | 'svg' | 'png' | 'gif' | 'webm' | 'frames' | 'animated-html';
  ansiColorDepth?: 8 | 16 | 256 | 'truecolor';
  htmlFontSize?: number;
  htmlFontFamily?: string;
  htmlBackground?: string;
  svgFontSize?: number;
  svgFontFamily?: string;
  svgBackground?: string | 'transparent';
  pngFontSize?: number;
  pngFontFamily?: string;
  pngPadding?: number;
  pngBackground?: string | 'transparent';
  gifQuality?: number;
  gifLoop?: boolean;
  webmBitrate?: number;
  framesFormat?: 'txt' | 'ans';
  cellSpacingX?: number;
  cellSpacingY?: number;
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

export type LoopMode = 'loop' | 'pingpong' | 'once';

export interface ActiveEffect {
  key: string;
  params: Record<string, number>;
}

export interface AnimationSettings {
  enabled: boolean;
  effects: ActiveEffect[];     // Pipeline order
  fps: number;                 // 10-60, default 24
  cycleDuration: number;       // 0.5-10s, default 3
  loopMode: LoopMode;
  presetKey: string;           // 'none' | preset key | 'custom'
}
