export type CycleDirection = 'ltr' | 'rtl' | 'ttb' | 'reverse';

export type VariableTypeFont =
  | 'Georgia'
  | 'Palatino'
  | 'Times'
  | 'Arial'
  | 'Helvetica'
  | 'IBM Plex Mono'
  | 'Courier';

export type VariableTypeColorPreset =
  | 'default'
  | 'warm-gold'
  | 'cool-blue'
  | 'amber'
  | 'rose';

/** RGB color values for variable type color presets. */
export const VARIABLE_TYPE_COLOR_PRESETS: Record<Exclude<VariableTypeColorPreset, 'default'>, string> = {
  'warm-gold': 'rgb(196,163,90)',
  'cool-blue': 'rgb(100,149,237)',
  'amber': 'rgb(255,191,0)',
  'rose': 'rgb(255,105,120)',
};

/** All available variable type fonts with their CSS font-family stacks. */
export const VARIABLE_TYPE_FONTS: Record<VariableTypeFont, string> = {
  'Georgia': "Georgia, serif",
  'Palatino': "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  'Times': "'Times New Roman', Times, serif",
  'Arial': "Arial, Helvetica, sans-serif",
  'Helvetica': "Helvetica, Arial, sans-serif",
  'IBM Plex Mono': "'IBM Plex Mono', 'Courier New', monospace",
  'Courier': "'Courier New', Courier, monospace",
};

/**
 * A single entry in the runtime-measured font palette.
 * Produced by font-measurer.ts, consumed by variable-type.ts.
 */
export interface MeasuredEntry {
  char: string;
  weight: number;
  italic: boolean;
  /** Normalized 0–1 pixel coverage brightness. */
  brightness: number;
  /** Character width relative to em (from canvas.measureText). */
  width: number;
}

/**
 * A sorted array of MeasuredEntry, ready for binary search lookup.
 * Sorted ascending by brightness.
 */
export type MeasuredPalette = MeasuredEntry[];

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
  variableTypeFont: VariableTypeFont;
  variableTypeColorPreset: VariableTypeColorPreset;

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
  /** Runtime-measured font palette, or undefined to use static fallback tables. */
  measuredPalette?: MeasuredPalette;
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
