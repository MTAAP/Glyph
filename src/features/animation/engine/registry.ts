import type { EffectDefinition } from './types';

export const EFFECT_REGISTRY = new Map<string, EffectDefinition>();

export function registerEffect(def: EffectDefinition): void {
  EFFECT_REGISTRY.set(def.key, def);
}

export function getEffect(key: string): EffectDefinition | undefined {
  return EFFECT_REGISTRY.get(key);
}
