import { createContext } from 'react';

export interface NavigationGuardContextValue {
  setDirty: (id: string, dirty: boolean) => void;
  unregister: (id: string) => void;
  requestLeave: (id: string, action: () => void) => void;
  allowNextNavigation: () => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
  activeId: string | null;
}

export const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);
