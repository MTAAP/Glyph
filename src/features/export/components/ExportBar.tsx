import {
  FileText,
  Terminal,
  Code,
  Image,
  Film,
  Video,
  Archive,
  Play,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/features/settings/store.ts';
import { cn } from '@/shared/utils/cn.ts';
import type { ExportOptions } from '@/shared/types/index.ts';
import { useExport } from '../hooks/useExport.ts';
import { FormatOptions } from './FormatOptions.tsx';

type Format = ExportOptions['format'];

const FORMAT_BUTTONS: {
  format: Format;
  label: string;
  icon: any;
  videoOnly?: boolean;
  animatedOnly?: boolean;
  copyable?: boolean;
}[] = [
  { format: 'txt', label: 'TXT', icon: FileText, copyable: true },
  { format: 'ansi', label: 'ANSI', icon: Terminal, copyable: true },
  { format: 'html', label: 'HTML', icon: Code, copyable: true },
  { format: 'png', label: 'PNG', icon: Image },
  { format: 'gif', label: 'GIF', icon: Film, animatedOnly: true },
  { format: 'webm', label: 'WebM', icon: Video, animatedOnly: true },
  { format: 'frames', label: 'Frames', icon: Archive, videoOnly: true },
  { format: 'animated-html', label: 'Animated HTML', icon: Play, animatedOnly: true },
];

export function ExportBar() {
  const renderResult = useAppStore((s) => s.renderResult);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [formatOptions, setFormatOptions] = useState<Partial<ExportOptions>>(
    {},
  );
  const { exportAs, copyToClipboard, isExporting, progress } = useExport();

  const isVideo = sourceInfo?.type === 'video';
  const animationEnabled = useAppStore(
    (s) => s.animation.enabled && s.animation.effects.length > 0,
  );
  const disabled = !renderResult || isExporting;

  const handleExport = (format: Format) => {
    setSelectedFormat(format);
    exportAs(format, formatOptions);
  };

  const handleCopy = (format: 'txt' | 'ansi' | 'html') => {
    copyToClipboard(format, formatOptions);
  };

  const visibleFormats = FORMAT_BUTTONS.filter((f) => {
    if (f.videoOnly) return isVideo;
    if (f.animatedOnly) return isVideo || animationEnabled;
    return true;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        {visibleFormats.map(({ format, label, copyable }) => (
          <div key={format} className="flex items-center">
            <button
              onClick={() => handleExport(format)}
              disabled={disabled}
              className={cn(
                'px-2 py-1 text-xs border border-border',
                'text-muted-foreground hover:text-accent hover:border-accent',
                'disabled:opacity-50 disabled:pointer-events-none',
                selectedFormat === format &&
                  isExporting &&
                  'border-accent text-accent bg-accent/10',
              )}
              title={`Export as ${label}`}
            >
              {label}
            </button>
            {copyable && (
              <button
                onClick={() =>
                  handleCopy(format as 'txt' | 'ansi' | 'html')
                }
                disabled={disabled}
                className={cn(
                  'px-1.5 py-1 text-xs border border-l-0 border-border',
                  'text-muted-foreground hover:text-accent hover:border-accent',
                  'disabled:opacity-50 disabled:pointer-events-none',
                )}
                title={`Copy ${label} to clipboard`}
              >
                [C]
              </button>
            )}
          </div>
        ))}
      </div>

      {isExporting && (
        <div className="h-1 bg-border overflow-hidden">
          <div
            className="h-full bg-accent"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <FormatOptions
        selectedFormat={selectedFormat}
        options={formatOptions}
        onChange={setFormatOptions}
      />
    </div>
  );
}
