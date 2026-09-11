import { useEffect, useRef } from 'react';
import { endSessionDueToInactivity } from '@/services/api';

/** Alineado con el access JWT (15m). Sobreescribible con VITE_SESSION_IDLE_MS. */
const DEFAULT_IDLE_MS = 15 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1_000;

function resolveIdleMs(): number {
  const raw = import.meta.env.VITE_SESSION_IDLE_MS;
  if (raw == null || raw === '') return DEFAULT_IDLE_MS;
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) && parsed >= 60_000 ? parsed : DEFAULT_IDLE_MS;
}

/**
 * Cierra la sesión si no hay interacción del usuario durante el tiempo de idle.
 * El polling de API no cuenta como actividad (evita que notificaciones mantengan la sesión).
 */
export function useIdleSessionTimeout(enabled: boolean) {
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBumpRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const idleMs = resolveIdleMs();
    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = () => {
      clearTimer();
      const remaining = idleMs - (Date.now() - lastActivityRef.current);
      timerRef.current = setTimeout(() => {
        if (cancelled) return;
        void endSessionDueToInactivity();
      }, Math.max(0, remaining));
    };

    const bump = () => {
      const now = Date.now();
      if (now - lastBumpRef.current < ACTIVITY_THROTTLE_MS) return;
      lastBumpRef.current = now;
      lastActivityRef.current = now;
      schedule();
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivityRef.current >= idleMs) {
        void endSessionDueToInactivity();
        return;
      }
      schedule();
    };

    lastActivityRef.current = Date.now();
    schedule();

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    const events = ['pointerdown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'wheel'] as const;
    for (const event of events) {
      window.addEventListener(event, bump, opts);
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearTimer();
      for (const event of events) {
        window.removeEventListener(event, bump, opts);
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);
}
