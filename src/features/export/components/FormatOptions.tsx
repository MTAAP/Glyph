import type { ExportOptions } from '@/shared/types/index.ts';
import { cn } from '@/shared/utils/cn.ts';

type Format = ExportOptions['format'];

interface FormatOptionsProps {
  selectedFormat: Format | null;
  options: Partial<ExportOptions>;
  onChange: (options: Partial<ExportOptions>) => void;
}

function LabeledInput({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      {children}
    </label>
  );
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
          <fieldset className="flex flex-wrap gap-3">
            {([8, 16, 256, 'truecolor'] as const).map((depth) => (
              <label key={depth} className="flex items-center gap-1.5 text-xs">
                <input
                  type="radio"
                  name="ansi-depth"
                  checked={(options.ansiColorDepth ?? 256) === depth}
                  onChange={() => onChange({ ...options, ansiColorDepth: depth })}
                  className="accent-primary"
                />
                <span>
                  {depth === 'truecolor'
                    ? 'Truecolor'
                    : `${depth}-color`}
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      );

    case 'html':
      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            HTML Options
          </span>
          <LabeledInput label="Font size">
            <input
              type="number"
              min={6}
              max={48}
              value={options.htmlFontSize ?? 12}
              onChange={(e) =>
                onChange({
                  ...options,
                  htmlFontSize: Number(e.target.value),
                })
              }
              className={cn(inputClass, 'w-20')}
            />
          </LabeledInput>
          <LabeledInput label="Font family">
            <input
              type="text"
              value={options.htmlFontFamily ?? 'monospace'}
              onChange={(e) =>
                onChange({ ...options, htmlFontFamily: e.target.value })
              }
              className={cn(inputClass, 'flex-1')}
            />
          </LabeledInput>
          <LabeledInput label="Background">
            <input
              type="color"
              value={options.htmlBackground ?? '#1a1a1a'}
              onChange={(e) =>
                onChange({ ...options, htmlBackground: e.target.value })
              }
              className="w-8 h-8 rounded border cursor-pointer"
            />
          </LabeledInput>
        </div>
      );

    case 'png':
      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            PNG Options
          </span>
          <LabeledInput label="Font size">
            <input
              type="number"
              min={6}
              max={48}
              value={options.pngFontSize ?? 14}
              onChange={(e) =>
                onChange({
                  ...options,
                  pngFontSize: Number(e.target.value),
                })
              }
              className={cn(inputClass, 'w-20')}
            />
          </LabeledInput>
          <LabeledInput label="Background">
            <input
              type="color"
              value={
                options.pngBackground === 'transparent'
                  ? '#000000'
                  : (options.pngBackground ?? '#1a1a1a')
              }
              onChange={(e) =>
                onChange({ ...options, pngBackground: e.target.value })
              }
              className="w-8 h-8 rounded border cursor-pointer"
            />
          </LabeledInput>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.pngBackground === 'transparent'}
              onChange={(e) =>
                onChange({
                  ...options,
                  pngBackground: e.target.checked
                    ? 'transparent'
                    : '#1a1a1a',
                })
              }
              className="accent-primary"
            />
            <span className="text-muted-foreground">Transparent background</span>
          </label>
        </div>
      );

    case 'gif':
      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            GIF Options
          </span>
          <LabeledInput label="Quality">
            <input
              type="range"
              min={1}
              max={30}
              value={options.gifQuality ?? 10}
              onChange={(e) =>
                onChange({
                  ...options,
                  gifQuality: Number(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-muted-foreground w-8 text-right">
              {options.gifQuality ?? 10}
            </span>
          </LabeledInput>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.gifLoop ?? true}
              onChange={(e) =>
                onChange({ ...options, gifLoop: e.target.checked })
              }
              className="accent-primary"
            />
            <span className="text-muted-foreground">Loop</span>
          </label>
        </div>
      );

    case 'webm':
      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            WebM Options
          </span>
          <LabeledInput label="Bitrate">
            <input
              type="range"
              min={500_000}
              max={10_000_000}
              step={500_000}
              value={options.webmBitrate ?? 2_500_000}
              onChange={(e) =>
                onChange({
                  ...options,
                  webmBitrate: Number(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-muted-foreground w-16 text-right text-xs">
              {((options.webmBitrate ?? 2_500_000) / 1_000_000).toFixed(1)}
              Mbps
            </span>
          </LabeledInput>
        </div>
      );

    case 'frames':
      return (
        <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Frames Options
          </span>
          <fieldset className="flex gap-3">
            {(['txt', 'ans'] as const).map((fmt) => (
              <label key={fmt} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="frames-format"
                  checked={(options.framesFormat ?? 'txt') === fmt}
                  onChange={() =>
                    onChange({ ...options, framesFormat: fmt })
                  }
                  className="accent-primary"
                />
                <span>{fmt.toUpperCase()}</span>
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.includeMetadata ?? false}
              onChange={(e) =>
                onChange({ ...options, includeMetadata: e.target.checked })
              }
              className="accent-primary"
            />
            <span className="text-muted-foreground">Include metadata</span>
          </label>
        </div>
      );

    default:
      return null;
  }
}
