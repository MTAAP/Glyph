import { useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Plus } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { ANIMATION_PRESETS } from '../presets';
import { EFFECT_REGISTRY } from '../engine/registry';
import '../engine/effects'; // Ensure effects are registered
import { EffectCard } from './EffectCard';
import { SettingSwitch, SettingSlider } from '@/shared/ui/SettingControls';
import type { LoopMode } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

export function AnimationControls() {
  const animation = useAppStore((s) => s.animation);
  const updateAnimation = useAppStore((s) => s.updateAnimation);
  const applyAnimationPreset = useAppStore((s) => s.applyAnimationPreset);
  const addEffect = useAppStore((s) => s.addEffect);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  return (
    <div className="space-y-3">
      <SettingSwitch
        label="Enable Animation"
        checked={animation.enabled}
        onCheckedChange={(v) => updateAnimation({ enabled: v })}
      />

      {animation.enabled && (
        <>
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <span className="text-sm">Preset</span>
            <Select.Root
              value={animation.presetKey}
              onValueChange={applyAnimationPreset}
            >
              <Select.Trigger
                className={cn(
                  'flex items-center justify-between w-full rounded-md border px-2.5 py-1.5 text-sm',
                  'bg-background hover:bg-accent transition-colors',
                )}
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className="rounded-md border bg-popover shadow-md overflow-hidden z-50"
                  position="popper"
                  sideOffset={4}
                >
                  <Select.Viewport className="p-1">
                    <Select.Item value="none" className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent outline-none data-[highlighted]:bg-accent">
                      <Select.ItemText>None</Select.ItemText>
                    </Select.Item>
                    {ANIMATION_PRESETS.map((p) => (
                      <Select.Item key={p.key} value={p.key} className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent outline-none data-[highlighted]:bg-accent">
                        <Select.ItemText>{p.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                    <Select.Item value="custom" className="flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent outline-none data-[highlighted]:bg-accent">
                      <Select.ItemText>Custom</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Global Controls */}
          <SettingSlider
            label="FPS"
            value={animation.fps}
            onValueChange={(v) => updateAnimation({ fps: v })}
            min={10}
            max={60}
            step={1}
          />
          <SettingSlider
            label="Cycle Duration"
            value={animation.cycleDuration}
            onValueChange={(v) => updateAnimation({ cycleDuration: v })}
            min={0.5}
            max={10}
            step={0.5}
          />

          {/* Loop Mode */}
          <div className="space-y-1.5">
            <span className="text-sm">Loop Mode</span>
            <div className="flex gap-1">
              {(['loop', 'pingpong', 'once'] as LoopMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateAnimation({ loopMode: mode })}
                  className={cn(
                    'flex-1 px-2 py-1 text-xs rounded-md border transition-colors',
                    animation.loopMode === mode
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent',
                  )}
                >
                  {mode === 'pingpong' ? 'Ping-pong' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Effects List */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Effects Pipeline</span>
            {animation.effects.length === 0 && (
              <p className="text-xs text-muted-foreground">No effects added. Select a preset or add effects manually.</p>
            )}
            {animation.effects.map((effect, i) => (
              <EffectCard
                key={`${effect.key}-${i}`}
                index={i}
                effectKey={effect.key}
                params={effect.params}
                isFirst={i === 0}
                isLast={i === animation.effects.length - 1}
              />
            ))}
          </div>

          {/* Add Effect */}
          <div className="relative">
            <button
              onClick={() => setAddMenuOpen(!addMenuOpen)}
              className={cn(
                'flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-md text-sm border',
                'text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
              )}
            >
              <Plus className="w-4 h-4" />
              Add Effect
            </button>
            {addMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-10 p-1">
                {Array.from(EFFECT_REGISTRY.entries()).map(([key, def]) => (
                  <button
                    key={key}
                    onClick={() => {
                      addEffect(key, { ...def.defaults });
                      setAddMenuOpen(false);
                    }}
                    className="flex flex-col w-full items-start px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors"
                  >
                    <span>{def.name}</span>
                    <span className="text-xs text-muted-foreground">{def.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
