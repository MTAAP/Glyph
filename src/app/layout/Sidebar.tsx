import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { RenderSettings } from '@/features/settings/components/RenderSettings';
import { ResolutionControls } from '@/features/settings/components/ResolutionControls';
import { CharsetPicker } from '@/features/settings/components/CharsetPicker';
import { ColorControls } from '@/features/settings/components/ColorControls';
import { VideoControls } from '@/features/settings/components/VideoControls';
import { ExportBar } from '@/features/export/components/ExportBar';
import { URLInput } from '@/features/input/components/URLInput';
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
    <Accordion.Item value={value} className="border-b last:border-b-0">
      <Accordion.Header>
        <Accordion.Trigger
          className={cn(
            'flex w-full items-center justify-between py-2.5 text-sm font-medium',
            'hover:text-foreground transition-colors',
            '[&[data-state=open]>svg]:rotate-180',
          )}
        >
          {title}
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="pb-3">{children}</div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function Sidebar() {
  const sourceInfo = useAppStore((s) => s.sourceInfo);

  const defaultSections = ['input', 'rendering', 'resolution', 'characters', 'color', 'export'];
  if (sourceInfo?.type === 'video') {
    defaultSections.push('video');
  }

  return (
    <aside className="w-[280px] max-lg:w-full border-r max-lg:border-r-0 max-lg:border-b overflow-y-auto shrink-0">
      <div className="px-4 py-2">
        <Accordion.Root type="multiple" defaultValue={defaultSections}>
          <Section value="input" title="Input">
            <URLInput />
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
