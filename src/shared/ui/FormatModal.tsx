import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/features/settings/store';
import { FileText, Terminal, Code, Image, Film, Video, Archive, Play } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { ExportOptions } from '@/shared/types';
import { useExport } from '@/features/export/hooks/useExport';
import { FormatOptions } from '@/features/export/components/FormatOptions';

type Format = ExportOptions['format'];

const FORMAT_ITEMS: {
  format: Format;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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

interface FormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'copy' | 'export';
}

export function FormatModal({ isOpen, onClose, mode }: FormatModalProps) {
  const renderResult = useAppStore((s) => s.renderResult);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
  const [formatOptions, setFormatOptions] = useState<Partial<ExportOptions>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const { exportAs, copyToClipboard, isExporting } = useExport();

  const isVideo = sourceInfo?.type === 'video';
  const animationEnabled = useAppStore(
    (s) => s.animation.enabled && s.animation.effects.length > 0,
  );

  const visibleFormats = FORMAT_ITEMS.filter((f) => {
    if (f.videoOnly) return isVideo;
    if (f.animatedOnly) return isVideo || animationEnabled;
    return true;
  });

  const executeAction = useCallback((format: Format) => {
    if (mode === 'export') {
      exportAs(format, formatOptions);
      onClose();
    }
  }, [mode, exportAs, formatOptions, onClose]);

  const handleClose = useCallback(() => {
    setFocusedIndex(0);
    setSelectedFormat(null);
    setFormatOptions({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      containerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;

    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClose();
        }
        return;
      }

      if (selectedFormat !== null) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedFormat(null);
          return;
        }
        if (e.key === 'Enter' && !isExporting) {
          e.preventDefault();
          executeAction(selectedFormat);
          return;
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : visibleFormats.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < visibleFormats.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = visibleFormats[focusedIndex];
        if (item) {
          if (mode === 'copy' && item.copyable) {
            copyToClipboard(item.format as 'txt' | 'ansi' | 'html', formatOptions);
            handleClose();
          } else if (mode === 'export') {
            setSelectedFormat(item.format);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, visibleFormats, selectedFormat, mode, isExporting, handleClose, copyToClipboard, exportAs, formatOptions, executeAction]);

  if (!isOpen || !renderResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80" onClick={onClose} />
      <div
        ref={containerRef}
        className="relative w-full max-w-md border bg-card shadow-lg p-4 focus:outline-none"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-foreground">
            {mode === 'copy' ? 'Copy to Clipboard' : 'Export As'}
          </h2>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-accent focus:outline-none"
          >
            [ESC] Close
          </button>
        </div>

        {!selectedFormat ? (
          <div className="flex flex-col gap-1">
            {visibleFormats.map((item, index) => {
              const Icon = item.icon;
              const isFocused = index === focusedIndex;
              const isDisabled = mode === 'copy' && !item.copyable;

              return (
                <button
                  key={item.format}
                  onClick={() => {
                    if (mode === 'copy' && item.copyable) {
                      copyToClipboard(item.format as 'txt' | 'ansi' | 'html', formatOptions);
                      onClose();
                    } else if (mode === 'export') {
                      setSelectedFormat(item.format);
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-left text-xs',
                    'border border-transparent',
                    'focus:outline-none',
                    'hover:border-accent',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent',
                    isFocused && 'border-accent bg-accent/10',
                  )}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  {isFocused && <span className="text-muted-foreground">[Enter]</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                onClick={() => setSelectedFormat(null)}
                className="hover:text-accent focus:outline-none"
              >
                [ESC] Back
              </button>
              <span>→</span>
              <span>{selectedFormat.toUpperCase()}</span>
            </div>
            <FormatOptions
              selectedFormat={selectedFormat}
              options={formatOptions}
              onChange={setFormatOptions}
            />
            <button
              onClick={() => executeAction(selectedFormat)}
              disabled={isExporting}
              className={cn(
                'mt-2 px-3 py-2 text-xs border border-accent',
                'bg-accent/10 text-accent',
                'hover:bg-accent/20',
                'focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isExporting ? 'Exporting...' : `[Enter] Export as ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
