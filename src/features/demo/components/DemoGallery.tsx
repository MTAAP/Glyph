import { useCallback } from 'react';
import { useAppStore } from '@/features/settings/store';
import type { SourceInfo } from '@/shared/types';

interface DemoCard {
  id: string;
  name: string;
  preset: string;
  colors: { fg: string; bg: string };
  art: string[];
}

const DEMO_CARDS: DemoCard[] = [
  {
    id: 'matrix',
    name: 'Matrix',
    preset: 'matrix',
    colors: { fg: '#00ff41', bg: '#050d05' },
    art: [
      ' . @ : . @ : . @ :',
      '@ : . @ : . @ : . ',
      ': . @ : . @ : . @ ',
      '. @ : . @ : . @ : ',
      '@ : . @ : . @ : . ',
      ': . @ : . @ : . @ ',
      '. @ : . @ : . @ : ',
      '@ : . @ : . @ : . ',
    ],
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk',
    preset: 'cyberpunk-neon',
    colors: { fg: '#ff00ff', bg: '#04000f' },
    art: [
      '#%@#%@%#@#%@#%@#@%',
      '@%#%@#%@%#@%#%@#@%',
      '%@%#@%#%@%#@%#%@#@',
      '#@%#@%#%@%#@%#@%#%',
      '@%#%@%#@#%@%#@%#@%',
      '%#@%#@%#%@%#%@%#@%',
      '#@%#@%#%@#%@%#@%#@',
      '@%#%@%#@%#@%#@%#@%',
    ],
  },
  {
    id: 'blade-runner',
    name: 'Blade Runner',
    preset: 'blade-runner',
    colors: { fg: '#ffb000', bg: '#080400' },
    art: [
      '  :+=*#@@@@#*=:+  ',
      ' :+*#@@@@@@@#*=:  ',
      ':+#@@@@@@@@@@@#+: ',
      '+#@@@@@@@@@@@@@#+ ',
      '#@@@#*+=+*#@@@#*@ ',
      '@@@*=:    :=*@@@#@',
      '@@*:        :*@@#@',
      '@*:    ..    :*@#@',
    ],
  },
  {
    id: 'blackwall',
    name: 'Blackwall',
    preset: 'blackwall',
    colors: { fg: '#dc143c', bg: '#0a0000' },
    art: [
      '#@#%@#%@#@%#@%@#@%',
      '@%@#@%@#@%@#%@%@#@',
      '%#@%#@%#@%#@#%@#@%',
      '#@%#@%@#@%#@%@#@%#',
      '@#%@#%@#%@#@%@%@#@',
      '%@%#@%#@%@#%@#@%#@',
      '#@#%@#%@#%@#%@#@%#',
      '@%@#@%@%@#@%@%@#@%',
    ],
  },
];

/** Generate a simple test-pattern image suitable for ASCII conversion demos. */
async function createDemoImage(): Promise<HTMLImageElement> {
  const size = 200;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  // Concentric gradient rings
  for (let i = 7; i >= 0; i--) {
    const radius = (size / 2) * (i / 7);
    const lightness = 10 + i * 11;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(0, 0%, ${lightness}%)`;
    ctx.fill();
  }

  // Horizontal contrast bands
  for (let y = 0; y < size; y += 20) {
    ctx.fillStyle = `rgba(0,0,0,${y % 40 === 0 ? 0.3 : 0.1})`;
    ctx.fillRect(0, y, size, 10);
  }

  // Vertical bands for structure
  for (let x = 0; x < size; x += 25) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(x, 0, 12, size);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to create demo image'));
    img.src = dataUrl;
  });
  return img;
}

export function DemoGallery() {
  const setSource = useAppStore((s) => s.setSource);
  const applyAnimationPreset = useAppStore((s) => s.applyAnimationPreset);
  const setAnimationPlaying = useAppStore((s) => s.setAnimationPlaying);

  const handleTryPreset = useCallback(
    async (presetKey: string) => {
      const img = await createDemoImage();
      const info: SourceInfo = {
        filename: 'demo.png',
        width: 200,
        height: 200,
        format: 'image/png',
        type: 'image',
      };
      setSource(img, null, info);
      applyAnimationPreset(presetKey);
      setAnimationPlaying(true);
    },
    [setSource, applyAnimationPreset, setAnimationPlaying],
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto select-none">
      {/* Header hint */}
      <div className="text-center space-y-0.5">
        <div className="text-lg text-muted-foreground">[↑]</div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Drop image or video to begin</p>
        <p className="text-[10px] text-muted-foreground/60 normal-case tracking-normal">or try a demo below</p>
      </div>

      {/* Demo grid */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {DEMO_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => handleTryPreset(card.preset)}
            className="group text-left border border-border hover:border-primary/60 transition-all duration-150 overflow-hidden"
            style={{ backgroundColor: card.colors.bg }}
          >
            {/* Terminal title bar */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 border-b"
              style={{ borderColor: card.colors.fg + '30' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.colors.fg + '70' }} />
              <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: card.colors.fg + 'cc' }}>
                {card.name}
              </span>
            </div>

            {/* ASCII art */}
            <div className="px-2 pt-1.5 pb-2">
              <pre
                className="font-mono text-[7px] leading-[1.15] overflow-hidden"
                style={{ color: card.colors.fg }}
                aria-hidden="true"
              >
                {card.art.join('\n')}
              </pre>
            </div>

            {/* Hover CTA */}
            <div
              className="px-2 pb-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="text-[8px] font-mono" style={{ color: card.colors.fg }}>
                [LOAD DEMO ▶]
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick try link */}
      <button
        onClick={() => handleTryPreset('matrix')}
        className="text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        [ TRY DEMO ]
      </button>
    </div>
  );
}
