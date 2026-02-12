import { useAppStore } from '@/features/settings/store';
import { getActiveCharset } from '@/features/settings/presets';
import { cn } from '@/shared/utils/cn';
import type { RenderSettings, CycleDirection } from '@/shared/types';

type WordMode = RenderSettings['wordMode'];

const WORD_MODES: { value: WordMode; label: string }[] = [
  { value: 'cycle', label: 'Cycle' },
  { value: 'density', label: 'Density' },
];

const CYCLE_DIRECTIONS: { value: CycleDirection; label: string }[] = [
  { value: 'ltr', label: 'L\u2192R' },
  { value: 'rtl', label: 'R\u2192L' },
  { value: 'ttb', label: 'T\u2193B' },
  { value: 'reverse', label: 'Rev' },
];

export function CharsetPicker() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const activeChars = getActiveCharset(settings.charsetPreset, settings.customCharset, settings.wordSequence);
  const isCustom = settings.charsetPreset === 'custom';
  const isWord = settings.charsetPreset === 'word';

  return (
    <div className="space-y-3">
      {isWord && (
        <>
          <input
            type="text"
            value={settings.wordSequence}
            onChange={(e) => updateSettings({ wordSequence: e.target.value })}
            placeholder="Enter word or phrase..."
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-secondary border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring',
            )}
          />
          <div className="flex rounded-md bg-secondary p-0.5">
            {WORD_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => updateSettings({ wordMode: mode.value })}
                className={cn(
                  'flex-1 px-2 py-1.5 text-xs font-medium rounded-sm transition-colors',
                  settings.wordMode === mode.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {settings.wordMode === 'cycle' && (
            <div className="flex rounded-md bg-secondary p-0.5">
              {CYCLE_DIRECTIONS.map((dir) => (
                <button
                  key={dir.value}
                  onClick={() => updateSettings({ cycleDirection: dir.value })}
                  className={cn(
                    'flex-1 px-2 py-1.5 text-xs font-medium rounded-sm transition-colors',
                    settings.cycleDirection === dir.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {settings.wordMode === 'cycle'
              ? 'Tiles the word across the grid; visibility controlled by luminance threshold.'
              : 'Uses the word characters as a luminance ramp from light to dark.'}
          </p>
        </>
      )}

      {isCustom && (
        <input
          type="text"
          value={settings.customCharset}
          onChange={(e) => updateSettings({ customCharset: e.target.value })}
          placeholder="Enter characters light to dark..."
          className={cn(
            'w-full px-3 py-2 rounded-md text-sm',
            'bg-secondary border border-input',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
      )}

      {/* Density preview strip */}
      <div className="overflow-hidden rounded-md bg-secondary p-2">
        <div
          className="font-mono text-xs tracking-widest text-center break-all leading-tight"
          title="Character density preview"
        >
          {activeChars === 'braille' ? '\u2800\u2801\u2803\u2807\u280f\u281f\u283f\u287f\u28ff' : activeChars}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {activeChars === 'braille'
          ? 'Braille mode (256 patterns)'
          : `${activeChars.length} characters`}
      </p>
    </div>
  );
}
