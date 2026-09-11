import { useCallback } from 'react';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

export function useInlineFormGuard(
  open: boolean,
  values: Record<string, unknown>,
  resetKey: string,
  onClose: () => void,
) {
  const { isDirty, markClean } = useDraftDirty(values, resetKey);
  const { requestLeave, dialog } = useUnsavedChangesGuard(open && isDirty);

  const guardedClose = useCallback(() => {
    requestLeave(onClose);
  }, [requestLeave, onClose]);

  return { isDirty, markClean, guardedClose, dialog };
}
