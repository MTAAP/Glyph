import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
  type RefObject,
} from 'react';
import { useAppStore } from '@/features/settings/store';

export type NavigableControlType =
  | 'slider'
  | 'switch'
  | 'select'
  | 'button'
  | 'number'
  | 'text'
  | 'color'
  | 'segmented'
  | 'radio';

export interface NavigableControl {
  id: string;
  type: NavigableControlType;
  ref: RefObject<HTMLElement | null>;
  getValue?: () => number | boolean | string;
  setValue?: (delta: number) => void;
  onClick?: () => void;
  step?: number;
  min?: number;
  max?: number;
  options?: string[];
}

interface SidebarNavigationContextValue {
  register: (control: NavigableControl) => () => void;
  getControls: () => NavigableControl[];
  focusedIndex: number | null;
  moveUp: () => void;
  moveDown: () => void;
  adjustValue: (delta: number) => void;
  triggerAction: () => void;
  setFocusedIndex: (index: number | null) => void;
}

const SidebarNavigationContext = createContext<SidebarNavigationContextValue | null>(null);

export function useSidebarNavigation() {
  const context = useContext(SidebarNavigationContext);
  if (!context) {
    throw new Error('useSidebarNavigation must be used within a SidebarNavigationProvider');
  }
  return context;
}

export function useSidebarNavigationOptional() {
  return useContext(SidebarNavigationContext);
}

interface Props {
  children: ReactNode;
}

export function SidebarNavigationProvider({ children }: Props) {
  const controlsRef = useRef<Map<string, NavigableControl>>(new Map());
  const orderRef = useRef<string[]>([]);
  const mountedRef = useRef(false);
  const initialFocusDoneRef = useRef(false);

  const focusedIndex = useAppStore((s) => s.sidebarFocusIndex);
  const setSidebarFocusIndex = useAppStore((s) => s.setSidebarFocusIndex);

  const getControls = useCallback((): NavigableControl[] => {
    // Return controls in DOM order by querying their positions
    const controls = Array.from(controlsRef.current.values()).filter(
      (c) => c.ref.current !== null
    );

    // Sort by DOM position
    controls.sort((a, b) => {
      const aEl = a.ref.current;
      const bEl = b.ref.current;
      if (!aEl || !bEl) return 0;

      const position = aEl.compareDocumentPosition(bEl);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    return controls;
  }, []);

  const register = useCallback((control: NavigableControl) => {
    controlsRef.current.set(control.id, control);

    // Add to order if not already present
    if (!orderRef.current.includes(control.id)) {
      orderRef.current.push(control.id);
    }

    // Auto-focus first control when initial controls register
    if (!initialFocusDoneRef.current) {
      initialFocusDoneRef.current = true;
      // Wait for all controls from the same render batch to register
      requestAnimationFrame(() => {
        setSidebarFocusIndex(0);
      });
    }

    return () => {
      // Clear focus if the unmounting control was the focused one
      const currentFocusIndex = useAppStore.getState().sidebarFocusIndex;
      if (currentFocusIndex !== null) {
        const controls = getControls();
        const focusedControl = controls[currentFocusIndex];
        if (focusedControl?.id === control.id) {
          setSidebarFocusIndex(null);
        }
      }

      controlsRef.current.delete(control.id);
      orderRef.current = orderRef.current.filter((id) => id !== control.id);
    };
  }, [getControls, setSidebarFocusIndex]);

  const moveUp = useCallback(() => {
    const controls = getControls();
    if (controls.length === 0) return;

    if (focusedIndex === null) {
      // Start from the last control
      setSidebarFocusIndex(controls.length - 1);
    } else if (focusedIndex > 0) {
      setSidebarFocusIndex(focusedIndex - 1);
    }
    // At first element, do nothing (no wrap)
  }, [focusedIndex, setSidebarFocusIndex, getControls]);

  const moveDown = useCallback(() => {
    const controls = getControls();
    if (controls.length === 0) return;

    if (focusedIndex === null) {
      // Start from the first control
      setSidebarFocusIndex(0);
    } else if (focusedIndex < controls.length - 1) {
      setSidebarFocusIndex(focusedIndex + 1);
    }
    // At last element, do nothing (no wrap)
  }, [focusedIndex, setSidebarFocusIndex, getControls]);

  const adjustValue = useCallback(
    (delta: number) => {
      if (focusedIndex === null) return;

      const controls = getControls();
      const control = controls[focusedIndex];
      if (!control) return;

      // Skip text inputs - they handle L/R for cursor movement
      if (control.type === 'text') return;

      // Skip color inputs
      if (control.type === 'color') return;

      // Skip buttons - they don't have values to adjust
      if (control.type === 'button') return;

      if (control.setValue) {
        control.setValue(delta);
      }
    },
    [focusedIndex, getControls]
  );

  const triggerAction = useCallback(() => {
    if (focusedIndex === null) return;

    const controls = getControls();
    const control = controls[focusedIndex];
    if (!control) return;

    // Buttons: call onClick
    if (control.type === 'button' && control.onClick) {
      control.onClick();
      return;
    }

    // Switches: toggle via setValue
    if (control.type === 'switch' && control.setValue) {
      control.setValue(0);
      return;
    }
  }, [focusedIndex, getControls]);

  const setFocusedIndex = useCallback(
    (index: number | null) => {
      setSidebarFocusIndex(index);
    },
    [setSidebarFocusIndex]
  );

  // Track mount state for DOM focus sync
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sync DOM focus when focusedIndex changes
  useEffect(() => {
    if (!mountedRef.current) return;
    if (focusedIndex === null) return;

    const controls = getControls();
    const control = controls[focusedIndex];
    if (control?.ref.current) {
      control.ref.current.focus({ preventScroll: false });
      control.ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex, getControls]);

  // Handle focus loss - when an element loses focus to something outside sidebar
  useEffect(() => {
    const handleFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget && !relatedTarget.closest('aside')) {
        // Focus moved outside sidebar, clear focus index
        setSidebarFocusIndex(null);
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, [setSidebarFocusIndex]);

  return (
    <SidebarNavigationContext.Provider
      value={{
        register,
        getControls,
        focusedIndex,
        moveUp,
        moveDown,
        adjustValue,
        triggerAction,
        setFocusedIndex,
      }}
    >
      {children}
    </SidebarNavigationContext.Provider>
  );
}
