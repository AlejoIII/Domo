import { useCallback, useContext, useEffect, useId } from 'react';
import { useBeforeUnload } from 'react-router-dom';
import { UnsavedChangesModal } from '@/components/forms/UnsavedChangesModal';
import { NavigationGuardContext } from '@/contexts/navigation-guard-context';

export function useUnsavedChangesGuard(when: boolean) {
  const id = useId();
  const guard = useContext(NavigationGuardContext);

  if (!guard) {
    throw new Error('useUnsavedChangesGuard debe usarse dentro de NavigationGuardProvider');
  }

  const {
    setDirty,
    unregister,
    requestLeave: requestLeaveFor,
    allowNextNavigation,
    confirmLeave,
    cancelLeave,
    activeId,
  } = guard;

  useEffect(() => {
    setDirty(id, when);
  }, [setDirty, id, when]);

  useEffect(() => () => unregister(id), [unregister, id]);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!when) return;
        event.preventDefault();
        event.returnValue = '';
      },
      [when],
    ),
  );

  const requestLeave = useCallback(
    (action: () => void) => requestLeaveFor(id, action),
    [requestLeaveFor, id],
  );

  const dialog = (
    <UnsavedChangesModal
      open={activeId === id}
      onConfirm={confirmLeave}
      onCancel={cancelLeave}
    />
  );

  return { requestLeave, allowNextNavigation, dialog };
}
