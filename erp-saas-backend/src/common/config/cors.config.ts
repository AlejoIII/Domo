import { ConfigService } from '@nestjs/config';

export function resolveCorsOrigin(config: ConfigService): string | string[] {
  const raw = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const isProd = config.get('NODE_ENV') === 'production';

  if (isProd && (!raw || raw.trim() === '*')) {
    throw new Error(
      'CORS_ORIGIN must be an explicit URL in production (comma-separated list allowed).',
    );
  }

  if (raw.trim() === '*') return '*';

  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}
