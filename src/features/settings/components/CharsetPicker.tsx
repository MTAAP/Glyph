import { useAppStore } from '@/features/settings/store';
import { getActiveCharset } from '@/features/settings/presets';
import { cn } from '@/shared/utils/cn';
import { NavigableTextInput } from '@/shared/ui/NavigableTextInput';
import { NavigableSegmented } from '@/shared/ui/NavigableSegmented';
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

/** Deduplicate characters while preserving order. */
function deduplicateChars(input: string): string {
  const seen = new Set<string>();
  let result = '';
  for (const ch of input) {
    if (!seen.has(ch)) {
      seen.add(ch);
      result += ch;
    }
  }
  return result;
}

export function CharsetPicker() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const activeChars = getActiveCharset(settings.charsetPreset, settings.customCharset, settings.wordSequence);
  const isCustom = settings.charsetPreset === 'custom';
  const isWord = settings.charsetPreset === 'word';

  const dedupedCustom = deduplicateChars(settings.customCharset);
  const isCustomInvalid = isCustom && dedupedCustom.length < 2;

  const handleCustomCharsetChange = (value: string) => {
    // Silently deduplicate on input
    const deduped = deduplicateChars(value);
    updateSettings({ customCharset: deduped });
  };

  return (
    <div className="space-y-3">
      {isWord && (
        <>
          <NavigableTextInput
            value={settings.wordSequence}
            onChange={(v) => updateSettings({ wordSequence: v })}
            placeholder="Enter word or phrase..."
          />
          <NavigableSegmented
            value={settings.wordMode}
            onValueChange={(v) => updateSettings({ wordMode: v })}
            options={WORD_MODES}
          />
          {settings.wordMode === 'cycle' && (
            <div className="flex bg-secondary p-0.5">
              {CYCLE_DIRECTIONS.map((dir) => (
                <button
                  key={dir.value}
                  onClick={() => updateSettings({ cycleDirection: dir.value })}
                  className={cn(
                    'flex-1 px-2 py-1.5 text-xs transition-colors',
                    settings.cycleDirection === dir.value
                      ? 'bg-background text-foreground'
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
              ? 'Tiles word across grid; visibility by luminance threshold.'
              : 'Uses word characters as luminance ramp light to dark.'}
          </p>
        </>
      )}

      {isCustom && (
        <>
          <NavigableTextInput
            value={settings.customCharset}
            onChange={handleCustomCharsetChange}
            placeholder="Enter characters light to dark..."
          />
          {isCustomInvalid && (
            <p className="text-xs text-red-400">
              At least 2 unique characters required.
            </p>
          )}
        </>
      )}

      {/* Density preview strip */}
      <div className="overflow-hidden border border-border p-2">
        <div
          className="text-xs tracking-widest text-center break-all leading-tight"
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
