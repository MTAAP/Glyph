import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { EFFECT_REGISTRY } from '../engine/registry';
import '../engine/effects'; // Ensure effects are registered
import { SettingSlider } from '@/shared/ui/SettingControls';
import { NavigableButton } from '@/shared/ui/NavigableButton';
import { cn } from '@/shared/utils/cn';

interface EffectCardProps {
  index: number;
  effectKey: string;
  params: Record<string, number>;
  isFirst: boolean;
  isLast: boolean;
}

export function EffectCard({ index, effectKey, params, isFirst, isLast }: EffectCardProps) {
  const removeEffect = useAppStore((s) => s.removeEffect);
  const updateEffectParams = useAppStore((s) => s.updateEffectParams);
  const reorderEffects = useAppStore((s) => s.reorderEffects);

  const def = EFFECT_REGISTRY.get(effectKey);
  if (!def) return null;

  const resolvedParams = { ...def.defaults, ...params };

  return (
    <div className="border p-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs">{def.name}</span>
        <div className="flex items-center gap-0.5">
          <NavigableButton
            onClick={() => reorderEffects(index, index - 1)}
            disabled={isFirst}
            className={cn(
              'p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors',
              'disabled:opacity-30 disabled:pointer-events-none',
            )}
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </NavigableButton>
          <NavigableButton
            onClick={() => reorderEffects(index, index + 1)}
            disabled={isLast}
            className={cn(
              'p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors',
              'disabled:opacity-30 disabled:pointer-events-none',
            )}
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </NavigableButton>
          <NavigableButton
            onClick={() => removeEffect(index)}
            className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="Remove effect"
          >
            <X className="w-3.5 h-3.5" />
          </NavigableButton>
        </div>
      </div>
      {Object.entries(def.paramMeta).map(([key, meta]) => (
        <SettingSlider
          key={key}
          label={meta.label}
          value={resolvedParams[key] ?? meta.min}
          onValueChange={(v) => updateEffectParams(index, { [key]: v })}
          min={meta.min}
          max={meta.max}
          step={meta.step}
        />
      ))}
    </div>
  );
}
