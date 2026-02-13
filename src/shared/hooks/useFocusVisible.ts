import { useEffect, useState } from 'react';

let lastInteractionType: 'mouse' | 'keyboard' = 'mouse';
const listeners = new Set<() => void>();

function handleKeyDown() {
  if (lastInteractionType !== 'keyboard') {
    lastInteractionType = 'keyboard';
    listeners.forEach((listener) => listener());
  }
}

function handleMouseDown() {
  if (lastInteractionType !== 'mouse') {
    lastInteractionType = 'mouse';
    listeners.forEach((listener) => listener());
  }
}

export function useFocusVisible() {
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsKeyboardFocus(lastInteractionType === 'keyboard');
    };

    listeners.add(update);
    update();

    return () => {
      listeners.delete(update);
    };
  }, []);

  return isKeyboardFocus;
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('mousedown', handleMouseDown, true);
}
