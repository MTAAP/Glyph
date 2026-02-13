import type { CharacterGrid } from '@/shared/types';

export type RGB = [number, number, number];

export interface AnimationContext {
  t: number; // Normalized time 0..1 within current cycle
  frame: number; // Frame index within cycle
  rows: number;
  cols: number;
  cycleDuration: number; // Seconds per cycle
}

export type AnimationEffect = (
  grid: CharacterGrid,
  ctx: AnimationContext,
  params: Record<string, number>,
) => CharacterGrid;

export interface ActiveEffect {
  key: string;
  params: Record<string, number>;
}

export interface EffectDefinition {
  key: string;
  name: string;
  description: string;
  defaults: Record<string, number>;
  paramMeta: Record<string, { label: string; min: number; max: number; step: number }>;
  apply: AnimationEffect;
}
