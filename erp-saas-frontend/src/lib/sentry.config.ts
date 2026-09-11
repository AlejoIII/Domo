import * as Sentry from '@sentry/react';
import { hasAnalyticsConsent } from '@/lib/cookie-consent';

export function initSentry(options?: { analytics?: boolean }) {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  const analytics = options?.analytics ?? hasAnalyticsConsent();
  const integrations: Array<ReturnType<typeof Sentry.browserTracingIntegration> | ReturnType<typeof Sentry.replayIntegration>> = [
    Sentry.browserTracingIntegration(),
  ];
  if (analytics) {
    integrations.push(
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    );
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    integrations,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: analytics
      ? Number(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE ?? '0')
      : 0,
  });
}

export { Sentry };
