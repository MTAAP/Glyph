import type { ExportOptions } from '@/shared/types/index.ts';
import { cn } from '@/shared/utils/cn.ts';
import { NavigableRadio } from '@/shared/ui/NavigableRadio.tsx';
import { NavigableNumberInput } from '@/shared/ui/NavigableNumberInput.tsx';
import { NavigableColorInput } from '@/shared/ui/NavigableColorInput.tsx';
import { NavigableSwitch } from '@/shared/ui/NavigableSwitch.tsx';
import { NavigableSlider } from '@/shared/ui/NavigableSlider.tsx';
import { NavigableSelect } from '@/shared/ui/NavigableSelect.tsx';

type Format = ExportOptions['format'];

const PNG_FONT_FAMILIES = [
  { value: "'IBM Plex Mono', 'Courier New', monospace", label: 'IBM Plex Mono' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'monospace', label: 'Monospace' },
  { value: "'Fira Code', monospace", label: 'Fira Code' },
];

interface FormatOptionsProps {
  selectedFormat: Format | null;
  options: Partial<ExportOptions>;
  onChange: (options: Partial<ExportOptions>) => void;
}

/** Map internal GIF quality (1-30, lower=better) to display value (1-30, higher=better) */
function gifQualityToDisplay(quality: number): number {
  return 31 - quality;
}

/** Map display value (1-30, higher=better) back to internal quality */
function displayToGifQuality(display: number): number {
  return 31 - display;
}

function gifQualityLabel(display: number): string {
  if (display >= 25) return 'High';
  if (display >= 15) return 'Medium';
  return 'Low';
}

export function FormatOptions({
  selectedFormat,
  options,
  onChange,
}: FormatOptionsProps) {
  if (!selectedFormat) return null;

  const inputClass = cn(
    'px-2 py-1 border bg-background text-xs',
    'focus:outline-none',
  );

  switch (selectedFormat) {
    case 'ansi':
      return (
        <div className="flex flex-col gap-2 p-3 border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            ANSI Options
          </span>
          <NavigableRadio
            name="ansi-depth"
            value={String(options.ansiColorDepth ?? 256)}
            onValueChange={(depth) => onChange({ ...options, ansiColorDepth: depth === 'truecolor' ? 'truecolor' : (parseInt(depth, 10) as 8 | 16 | 256) })}
            options={[
              { value: '8', label: '8-color' },
              { value: '16', label: '16-color' },
              { value: '256', label: '256-color' },
              { value: 'truecolor', label: 'Truecolor' },
            ]}
          />
        </div>
      );

    case 'html':
      return (
        <div className="flex flex-col gap-2 p-3 border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            HTML Options
          </span>
          <NavigableNumberInput
            label="Font size"
            value={options.htmlFontSize ?? 12}
            onValueChange={(v) => onChange({ ...options, htmlFontSize: v })}
            min={6}
            max={48}
          />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-24 shrink-0">Font family</span>
            <input
              type="text"
              value={options.htmlFontFamily ?? 'monospace'}
              onChange={(e) =>
                onChange({ ...options, htmlFontFamily: e.target.value })
              }
              className={cn(inputClass, 'flex-1')}
            />
          </div>
          <NavigableColorInput
            label="Background"
            value={options.htmlBackground ?? '#1a1a1a'}
            onChange={(v) => onChange({ ...options, htmlBackground: v })}
          />
        </div>
      );

    case 'png':
      return (
        <div className="flex flex-col gap-2 p-3 border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            PNG Options
          </span>
          <NavigableNumberInput
            label="Font size"
            value={options.pngFontSize ?? 14}
            onValueChange={(v) => onChange({ ...options, pngFontSize: v })}
            min={6}
            max={48}
          />
          <NavigableSelect
            label="Font family"
            value={options.pngFontFamily ?? "'IBM Plex Mono', 'Courier New', monospace"}
            onValueChange={(v) => onChange({ ...options, pngFontFamily: v })}
            options={PNG_FONT_FAMILIES}
          />
          <NavigableSlider
            label="Padding"
            value={options.pngPadding ?? 16}
            onValueChange={(v) => onChange({ ...options, pngPadding: v })}
            min={0}
            max={64}
            step={1}
            formatValue={(v) => `${v}px`}
          />
          <NavigableColorInput
            label="Background"
            value={
              options.pngBackground === 'transparent'
                ? '#000000'
                : (options.pngBackground ?? '#1a1a1a')
            }
            onChange={(v) => onChange({ ...options, pngBackground: v })}
          />
          <NavigableSwitch
            label="Transparent background"
            checked={options.pngBackground === 'transparent'}
            onCheckedChange={(v) =>
              onChange({
                ...options,
                pngBackground: v ? 'transparent' : '#1a1a1a',
              })
            }
          />
        </div>
      );

    case 'gif': {
      const internalQuality = options.gifQuality ?? 10;
      const displayValue = gifQualityToDisplay(internalQuality);
      return (
        <div className="flex flex-col gap-2 p-3 border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            GIF Options
          </span>
          <NavigableSlider
            label="Quality"
            value={displayValue}
            onValueChange={(v) => onChange({ ...options, gifQuality: displayToGifQuality(v) })}
            min={1}
            max={30}
            step={1}
            formatValue={(v) => `${gifQualityLabel(v)} (${v})`}
          />
          <NavigableSwitch
            label="Loop"
            checked={options.gifLoop ?? true}
            onCheckedChange={(v) => onChange({ ...options, gifLoop: v })}
          />
        </div>
      );
    }

    case 'webm':
      return (
        <div className="flex flex-col gap-2 p-3 border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            WebM Options
          </span>
          <NavigableSlider
            label="Bitrate"
            value={options.webmBitrate ?? 2_500_000}
            onValueChange={(v) => onChange({ ...options, webmBitrate: v })}
            min={500_000}
            max={10_000_000}
            step={500_000}
            formatValue={(v) => `${(v / 1_000_000).toFixed(1)} Mbps`}
          />
        </div>
      );

    case 'frames':
      return (
        <div className="flex flex-col gap-2 p-3 border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Frames Options
          </span>
          <NavigableRadio
            name="frames-format"
            value={options.framesFormat ?? 'txt'}
            onValueChange={(fmt) => onChange({ ...options, framesFormat: fmt as 'txt' | 'ans' })}
            options={[
              { value: 'txt', label: 'TXT' },
              { value: 'ans', label: 'ANS' },
            ]}
          />
          <NavigableSwitch
            label="Include metadata"
            checked={options.includeMetadata ?? false}
            onCheckedChange={(v) => onChange({ ...options, includeMetadata: v })}
          />
        </div>
      );

    default:
      return null;
  }
}
