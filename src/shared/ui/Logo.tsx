const LOGO_ART = `   .
   o
  ( )
 (   )
(     )
 \\   /
  \\ /
   V`;

const LOGO_TEXT = 'G L Y P H';

export function Logo({ variant = 'full' }: { variant?: 'compact' | 'full' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 select-none">
        <pre className="text-[10px] leading-[1.1] text-muted-foreground m-0 font-[inherit]">
          {'\\   /\n \\ /\n  V'}
        </pre>
        <span className="text-sm font-bold tracking-[0.25em] uppercase">
          {LOGO_TEXT}
        </span>
      </div>
    );
  }

  return (
    <div className="select-none text-center">
      <pre className="text-xs leading-[1.3] text-muted-foreground m-0 font-[inherit] inline-block text-left">
        {LOGO_ART}
      </pre>
      <div className="text-sm font-bold tracking-[0.35em] mt-1">
        {LOGO_TEXT}
      </div>
    </div>
  );
}
