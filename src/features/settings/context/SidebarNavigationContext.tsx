import {
  createContext,
  useContext,
  type RefObject,
} from 'react';

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

export interface SidebarNavigationContextValue {
  register: (control: NavigableControl) => () => void;
  getControls: () => NavigableControl[];
  focusedIndex: number | null;
  moveUp: () => void;
  moveDown: () => void;
  adjustValue: (delta: number) => void;
  triggerAction: () => void;
  setFocusedIndex: (index: number | null) => void;
}

export const SidebarNavigationContext = createContext<SidebarNavigationContextValue | null>(null);

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
