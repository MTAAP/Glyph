import { useState, useCallback, useEffect, type RefObject } from 'react';

interface FullscreenResult {
  isFullscreen: boolean;
  toggle: () => void;
  isSupported: boolean;
}

export function useFullscreen(
  targetRef: RefObject<HTMLElement | null>,
): FullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isSupported = typeof document.fullscreenEnabled !== 'undefined' && document.fullscreenEnabled;

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {/* browser denied */});
    } else {
      targetRef.current?.requestFullscreen().catch(() => {/* browser denied */});
    }
  }, [targetRef, isSupported]);

  return { isFullscreen, toggle, isSupported };
}
