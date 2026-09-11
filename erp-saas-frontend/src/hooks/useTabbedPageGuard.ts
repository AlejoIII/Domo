import { useCallback, useState } from 'react';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

export function useTabbedPageGuard() {
  const [tabDirty, setTabDirty] = useState(false);
  const { requestLeave, dialog } = useUnsavedChangesGuard(tabDirty);

  const switchTab = useCallback(
    <T extends string>(next: T, current: T, onSwitch: (next: T) => void) => {
      if (next === current) return;
      requestLeave(() => {
        onSwitch(next);
        setTabDirty(false);
      });
    },
    [requestLeave],
  );

  return { setTabDirty, switchTab, dialog };
}
