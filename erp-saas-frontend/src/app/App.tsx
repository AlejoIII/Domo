import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/store/auth.store';
import { applyAppearance } from '@/lib/apply-appearance';
import { canCustomizeAppearance } from '@/lib/appearance-access';
import { useEffect } from 'react';
import { Sentry } from '@/lib/sentry.config';
import { AppErrorFallback } from '@/components/layout/AppErrorFallback';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export function App() {
  const theme = useThemeStore((s) => s.theme);
  const accent = useThemeStore((s) => s.accent);
  const radius = useThemeStore((s) => s.radius);
  const fontScale = useThemeStore((s) => s.fontScale);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    applyAppearance({
      theme,
      accent,
      radius,
      fontScale,
      reducedMotion,
      allowCustomization: canCustomizeAppearance(user),
    });
    const timer = window.setTimeout(() => {
      root.classList.remove('theme-switching');
    }, 400);
    return () => window.clearTimeout(timer);
    // Solo relanzamos si cambian los campos de `user` que afectan a canCustomizeAppearance;
    // evita reaplicar el tema en cada cambio de referencia de `user` por otros motivos (p.ej. nombre).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, accent, radius, fontScale, reducedMotion, user?.planCode, user?.subscriptionStatus]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyAppearance({
        theme: 'system',
        accent: useThemeStore.getState().accent,
        radius: useThemeStore.getState().radius,
        fontScale: useThemeStore.getState().fontScale,
        reducedMotion: useThemeStore.getState().reducedMotion,
        allowCustomization: canCustomizeAppearance(useAuthStore.getState().user),
      });
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <Sentry.ErrorBoundary fallback={AppErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
