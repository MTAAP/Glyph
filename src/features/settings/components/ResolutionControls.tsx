import { Link, Unlink } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { NavigableSlider } from '@/shared/ui/NavigableSlider';
import { NavigableSwitch } from '@/shared/ui/NavigableSwitch';

export function ResolutionControls() {
  const outputWidth = useAppStore((s) => s.settings.outputWidth);
  const aspectRatioCorrection = useAppStore((s) => s.settings.aspectRatioCorrection);
  const lockAspectRatio = useAppStore((s) => s.settings.lockAspectRatio);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  const cellSpacingX = useAppStore((s) => s.cellSpacingX);
  const cellSpacingY = useAppStore((s) => s.cellSpacingY);
  const spacingLinked = useAppStore((s) => s.spacingLinked);
  const setCellSpacing = useAppStore((s) => s.setCellSpacing);
  const setSpacingLinked = useAppStore((s) => s.setSpacingLinked);

  const computedHeight = sourceInfo
    ? Math.round(
        (outputWidth / sourceInfo.width) *
          sourceInfo.height *
          aspectRatioCorrection,
      )
    : null;

  return (
    <div className="space-y-3">
      <NavigableSlider
        label="Output Width"
        value={outputWidth}
        onValueChange={(v) => updateSettings({ outputWidth: v })}
        min={100}
        max={600}
        step={1}
      />

      <NavigableSlider
        label="Aspect Ratio Correction"
        value={aspectRatioCorrection}
        onValueChange={(v) => updateSettings({ aspectRatioCorrection: v })}
        min={0.3}
        max={1.0}
        step={0.05}
        formatValue={(v) => v.toFixed(2)}
      />

      <NavigableSwitch
        label="Lock Aspect Ratio"
        checked={lockAspectRatio}
        onCheckedChange={(v) => updateSettings({ lockAspectRatio: v })}
      />

      {spacingLinked ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-1.5">
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
            <span className="text-xs text-muted-foreground tabular-nums">{Math.round(cellSpacingX * 100)}%</span>
          </div>
          <NavigableSlider
            label="Cell Spacing"
            value={cellSpacingX}
            onValueChange={(v) => setCellSpacing('both', v)}
            min={0.5}
            max={3.0}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
            hideLabel
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1.5">
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
          </div>
          <NavigableSlider
            label="Letter Spacing"
            value={cellSpacingX}
            onValueChange={(v) => setCellSpacing('x', v)}
            min={0.5}
            max={3.0}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />

          <NavigableSlider
            label="Line Spacing"
            value={cellSpacingY}
            onValueChange={(v) => setCellSpacing('y', v)}
            min={0.5}
            max={3.0}
            step={0.05}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      )}

      {sourceInfo && computedHeight !== null && (
        <p className="text-xs text-muted-foreground">
          Output: {outputWidth} &times; {computedHeight} characters
        </p>
      )}
    </div>
  );
}
