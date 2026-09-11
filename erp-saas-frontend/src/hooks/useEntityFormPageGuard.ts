import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

export function useEntityFormPageGuard(exitTo: string, alsoDirty = false) {
  const navigate = useNavigate();
  const [formDirty, setFormDirty] = useState(false);
  const { requestLeave, allowNextNavigation, dialog } = useUnsavedChangesGuard(formDirty || alsoDirty);

  const leave = useCallback(
    () => requestLeave(() => navigate(exitTo)),
    [exitTo, navigate, requestLeave],
  );

  const navigateAfterSave = useCallback(
    (to?: string) => {
      setFormDirty(false);
      allowNextNavigation();
      navigate(to ?? exitTo);
    },
    [allowNextNavigation, exitTo, navigate],
  );

  return { setFormDirty, leave, navigateAfterSave, dialog };
}
