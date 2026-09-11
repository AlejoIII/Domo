import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { markSessionExpired } from '@/lib/session-expired';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

let sessionLogoutInProgress = false;

function forceLogout() {
  if (sessionLogoutInProgress) return;
  sessionLogoutInProgress = true;
  markSessionExpired();
  useAuthStore.getState().logout();
  const path = window.location.pathname;
  if (!path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/accept-invite')) {
    window.location.assign('/login');
  }
}

/** Cierra sesión por caducidad/inactividad: revoca cookies si puede y redirige al login. */
export async function endSessionDueToInactivity(): Promise<void> {
  if (sessionLogoutInProgress) return;
  try {
    // axios directo para no entrar en el interceptor de refresh.
    await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
  } catch {
    // Cookies ya inválidas o red caída: igual forzamos el logout local.
  }
  forceLogout();
}

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/auth/refresh')
    || url.includes('/auth/accept-invite')
    || url.includes('/auth/logout');
}

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 403) {
      const data = error.response?.data as {
        code?: string;
        limit?: number;
        current?: number;
        feature?: string;
        upgradePlan?: string;
      } | undefined;
      if (
        data?.code === 'PLAN_LIMIT_USERS'
        || data?.code === 'PLAN_LIMIT_DOCUMENTS'
        || data?.code === 'PLAN_FEATURE_LOCKED'
      ) {
        const params = new URLSearchParams({ code: data.code });
        if (data.limit != null) params.set('limit', String(data.limit));
        if (data.current != null) params.set('current', String(data.current));
        if (data.feature) params.set('feature', data.feature);
        if (data.upgradePlan) params.set('upgrade', data.upgradePlan);
        if (!window.location.pathname.startsWith('/plan-limit')) {
          window.location.assign(`/plan-limit?${params.toString()}`);
        }
      }
    }

    if (status !== 401 || !original || original._retry || isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshed = await refreshSession();
    if (refreshed) {
      return api(original);
    }

    forceLogout();
    return Promise.reject(error);
  },
);

export async function refreshSessionWithToken(refreshToken: string): Promise<boolean> {
  try {
    await axios.post('/api/v1/auth/refresh', { refreshToken }, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

export async function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) return;
  await new Promise<void>((resolve) => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}
