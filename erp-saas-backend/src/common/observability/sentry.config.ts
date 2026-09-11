import * as Sentry from '@sentry/node';
import type { ConfigService } from '@nestjs/config';

export function initSentry(config: ConfigService, service: 'api' | 'worker') {
  const dsn = config.get<string>('SENTRY_DSN');
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: config.get('NODE_ENV', 'development'),
    release: process.env.npm_package_version,
    serverName: `domo-${service}`,
    tracesSampleRate: Number(config.get('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
  });
}

export { Sentry };
