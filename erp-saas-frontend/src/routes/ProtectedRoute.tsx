import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { fetchMe } from '@/services/auth.service';
import { waitForAuthHydration } from '@/services/api';
import { applyNotificationPrefs } from '@/lib/notification-prefs';
import { markSessionExpired } from '@/lib/session-expired';
import { useIdleSessionTimeout } from '@/hooks/useIdleSessionTimeout';
import { Loader } from '@/components/ui/Loader';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [ready, setReady] = useState(false);

  useIdleSessionTimeout(hydrated && ready && isAuthenticated && !!user && user.emailVerified !== false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || !user) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    waitForAuthHydration()
      .then(() => fetchMe())
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          if (me.notificationPrefs) {
            applyNotificationPrefs(me.notificationPrefs);
          }
        }
      })
      .catch((err: { response?: { status?: number } }) => {
        if (!cancelled && err.response?.status === 401) {
          markSessionExpired();
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => { cancelled = true; };
    // Usamos user?.id (no `user`) a propósito: solo re-ejecutar cuando cambia de usuario,
    // no en cada actualización de campos del mismo usuario (p.ej. tras setUser en este mismo efecto).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated, user?.id, setUser, logout]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (user.emailVerified === false) {
    return <Navigate to="/verify-email" replace state={{ email: user.email }} />;
  }

  return <Outlet />;
}
