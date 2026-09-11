import { useCallback, useRef } from 'react';

export function useDraftDirty<T>(values: T, resetKey?: string) {
  const baselineRef = useRef<{ key: string; snapshot: string } | null>(null);
  const key = resetKey ?? 'default';
  const snapshot = JSON.stringify(values);

  if (!baselineRef.current || baselineRef.current.key !== key) {
    baselineRef.current = { key, snapshot };
  }

  const isDirty = snapshot !== baselineRef.current.snapshot;

  const markClean = useCallback(
    (next?: T) => {
      const snap = JSON.stringify(next !== undefined ? next : values);
      baselineRef.current = { key, snapshot: snap };
    },
    [key, values],
  );

  /** Sincroniza la línea base tras cargar datos del servidor (evita falsos positivos). */
  const resetBaseline = useCallback((next: T, nextKey?: string) => {
    const k = nextKey ?? key;
    baselineRef.current = { key: k, snapshot: JSON.stringify(next) };
  }, [key]);

  return { isDirty, markClean, resetBaseline };
}
