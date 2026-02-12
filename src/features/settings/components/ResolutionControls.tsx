import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { Link, Unlink } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

export function ResolutionControls() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const cellSpacingX = useAppStore((s) => s.cellSpacingX);
  const cellSpacingY = useAppStore((s) => s.cellSpacingY);
  const spacingLinked = useAppStore((s) => s.spacingLinked);
  const setCellSpacing = useAppStore((s) => s.setCellSpacing);
  const setSpacingLinked = useAppStore((s) => s.setSpacingLinked);

  const computedHeight = sourceInfo
    ? Math.round(
        (settings.outputWidth / sourceInfo.width) *
          sourceInfo.height *
          settings.aspectRatioCorrection,
      )
    : null;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm">Output Width</span>
          <input
            type="number"
            value={settings.outputWidth}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 100 && v <= 600) {
                updateSettings({ outputWidth: v });
              }
            }}
            min={100}
            max={600}
            className="w-16 text-right text-xs bg-secondary rounded-md px-2 py-1 tabular-nums border-none outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <Slider.Root
          value={[settings.outputWidth]}
          onValueChange={([v]) => updateSettings({ outputWidth: v })}
          min={100}
          max={600}
          step={1}
          className="relative flex items-center select-none touch-none h-5"
        >
          <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </Slider.Root>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm">Aspect Ratio Correction</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {settings.aspectRatioCorrection.toFixed(2)}
          </span>
        </div>
        <Slider.Root
          value={[settings.aspectRatioCorrection]}
          onValueChange={([v]) => updateSettings({ aspectRatioCorrection: v })}
          min={0.3}
          max={1.0}
          step={0.05}
          className="relative flex items-center select-none touch-none h-5"
        >
          <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </Slider.Root>
      </div>

      <label className="flex items-center justify-between gap-2">
        <span className="text-sm">Lock Aspect Ratio</span>
        <Switch.Root
          checked={settings.lockAspectRatio}
          onCheckedChange={(v) => updateSettings({ lockAspectRatio: v })}
          className={cn(
            'w-9 h-5 rounded-full relative transition-colors',
            'bg-input data-[state=checked]:bg-primary',
          )}
        >
          <Switch.Thumb
            className={cn(
              'block w-4 h-4 rounded-full bg-background transition-transform',
              'translate-x-0.5 data-[state=checked]:translate-x-[18px]',
            )}
          />
        </Switch.Root>
      </label>

      {spacingLinked ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">Cell Spacing</span>
              <button
                type="button"
                onClick={() => setSpacingLinked(false)}
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Unlink axes"
              >
                <Link className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(cellSpacingX * 100)}%
            </span>
          </div>
          <Slider.Root
            value={[cellSpacingX]}
            onValueChange={([v]) => setCellSpacing('both', v)}
            min={0.5}
            max={3.0}
            step={0.05}
            className="relative flex items-center select-none touch-none h-5"
          >
            <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
              <Slider.Range className="absolute h-full rounded-full bg-primary" />
            </Slider.Track>
            <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </Slider.Root>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">Letter Spacing</span>
                <button
                  type="button"
                  onClick={() => setSpacingLinked(true)}
                  className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Link axes"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(cellSpacingX * 100)}%
              </span>
            </div>
            <Slider.Root
              value={[cellSpacingX]}
              onValueChange={([v]) => setCellSpacing('x', v)}
              min={0.5}
              max={3.0}
              step={0.05}
              className="relative flex items-center select-none touch-none h-5"
            >
              <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
                <Slider.Range className="absolute h-full rounded-full bg-primary" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </Slider.Root>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm">Line Spacing</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(cellSpacingY * 100)}%
              </span>
            </div>
            <Slider.Root
              value={[cellSpacingY]}
              onValueChange={([v]) => setCellSpacing('y', v)}
              min={0.5}
              max={3.0}
              step={0.05}
              className="relative flex items-center select-none touch-none h-5"
            >
              <Slider.Track className="relative grow h-1.5 rounded-full bg-secondary">
                <Slider.Range className="absolute h-full rounded-full bg-primary" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 rounded-full bg-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </Slider.Root>
          </div>
        </div>
      )}

      {sourceInfo && computedHeight !== null && (
        <p className="text-xs text-muted-foreground">
          Output: {settings.outputWidth} &times; {computedHeight} characters
        </p>
      )}
    </div>
  );
}
