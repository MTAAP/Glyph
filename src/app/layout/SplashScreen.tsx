import { useState, useEffect } from 'react';
import { Logo } from '@/shared/ui/Logo';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const doneTimer = setTimeout(() => onDone(), 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 600ms ease-out',
      }}
    >
      <Logo variant="full" />
    </div>
  );
}
