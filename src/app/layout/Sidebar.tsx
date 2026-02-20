import * as Accordion from '@radix-ui/react-accordion';
import { useAppStore } from '@/features/settings/store';
import { RenderSettings } from '@/features/settings/components/RenderSettings';
import { ResolutionControls } from '@/features/settings/components/ResolutionControls';
import { PresetSelector } from '@/features/settings/components/PresetSelector';
import { CharsetPicker } from '@/features/settings/components/CharsetPicker';
import { ColorControls } from '@/features/settings/components/ColorControls';
import { VideoControls } from '@/features/settings/components/VideoControls';
import { ExportBar } from '@/features/export/components/ExportBar';
import { AnimationControls } from '@/features/animation/components/AnimationControls';
import { InputControls } from '@/features/input/components/InputControls';
import { CropControls } from '@/features/crop/components/CropControls';
import { cn } from '@/shared/utils/cn';

function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value} className="border-b border-border last:border-b-0">
      <Accordion.Header>
        <Accordion.Trigger
          className={cn(
            'group flex w-full items-center justify-between py-2.5 text-xs font-medium uppercase tracking-wide',
            'text-muted-foreground hover:text-accent',
          )}
        >
          <span>{title}</span>
          <span className="text-muted-foreground normal-case">
            <span className="group-data-[state=open]:hidden">[&gt;]</span>
            <span className="group-data-[state=closed]:hidden">[v]</span>
          </span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up px-1">
        <div className="pb-3">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function Sidebar() {
  const sourceInfo = useAppStore((s) => s.sourceInfo);
  // Characters section is always visible so users can see the density preview strip

  const defaultSections = ['input', 'export'];

  return (
    <aside className="w-[280px] max-lg:w-full border-r max-lg:border-r-0 max-lg:border-b overflow-y-auto shrink-0 bg-card">
      <div className="px-4 py-2">
        <div className="pb-2 border-b border-border mb-2">
          <PresetSelector />
        </div>
        <Accordion.Root type="multiple" defaultValue={defaultSections}>
          <Section value="input" title="Input">
            <InputControls />
          </Section>
          <Section value="crop" title="Crop">
            <CropControls />
          </Section>
          <Section value="rendering" title="Rendering">
            <RenderSettings />
          </Section>
          <Section value="resolution" title="Resolution">
            <ResolutionControls />
          </Section>
          <Section value="characters" title="Characters">
            <CharsetPicker />
          </Section>
          <Section value="color" title="Color">
            <ColorControls />
          </Section>
          <Section value="animation" title="Animation">
            <AnimationControls />
          </Section>
          <Section value="export" title="Export">
            <ExportBar />
          </Section>
          {sourceInfo?.type === 'video' && (
            <Section value="video" title="Video">
              <VideoControls />
            </Section>
          )}
        </Accordion.Root>
      </div>
    </aside>
  );
}
