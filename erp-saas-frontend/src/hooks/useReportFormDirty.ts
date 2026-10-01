import { useEffect } from 'react';
import { useDraftDirty } from '@/hooks/useDraftDirty';

export function useReportFormDirty(
  rhfDirty: boolean,
  onDirtyChange: ((dirty: boolean) => void) | undefined,
  external?: { values: Record<string, unknown>; resetKey?: string },
) {
  const { isDirty: externalDirty } = useDraftDirty(
    external?.values ?? {},
    external?.resetKey,
  );
  const dirty = rhfDirty || (external ? externalDirty : false);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  return dirty;
}
