import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const WEAK_SECRET_MARKERS = [
  'change-me',
  'change-me-in-production',
  'change-me-refresh-in-production',
  'secret',
  'password',
  'jwt_secret',
];

function isWeakSecret(value: string | undefined): boolean {
  if (!value || value.trim().length < 32) return true;
  const lower = value.trim().toLowerCase();
  return WEAK_SECRET_MARKERS.some((m) => lower === m || lower.includes('change-me'));
}

/**
 * Valida configuración crítica al arrancar en producción.
 * Falla en duro ante secretos débiles / CORS inválido (ya cubierto aparte).
 */
export function assertProductionConfig(config: ConfigService, processName = 'api'): void {
  if (config.get('NODE_ENV') !== 'production') return;

  const logger = new Logger(`ProdConfig:${processName}`);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isWeakSecret(config.get<string>('JWT_SECRET'))) {
    errors.push('JWT_SECRET must be a strong random secret (≥32 chars), not a placeholder');
  }
  if (isWeakSecret(config.get<string>('JWT_REFRESH_SECRET'))) {
    errors.push('JWT_REFRESH_SECRET must be a strong random secret (≥32 chars), not a placeholder');
  }

  const frontendUrl = config.get<string>('FRONTEND_URL')?.trim();
  if (!frontendUrl || frontendUrl.includes('localhost')) {
    warnings.push('FRONTEND_URL should be your public app URL in production');
  }

  if (config.get('COOKIE_SECURE') !== 'true') {
    warnings.push('COOKIE_SECURE should be true behind HTTPS');
  }

  if (!config.get('REDIS_URL')?.trim()) {
    warnings.push('REDIS_URL is recommended in production (rate limits, queues, cache)');
  }

  const emailProvider = (config.get<string>('EMAIL_PROVIDER', 'console') ?? 'console').toLowerCase();
  if (emailProvider === 'console') {
    warnings.push('EMAIL_PROVIDER=console will not send real email (invites/verification)');
  }

  if (config.get('EMAIL_VERIFICATION_ENABLED') !== 'true') {
    warnings.push('EMAIL_VERIFICATION_ENABLED=false leaves open registration easier to abuse');
  }

  if ((config.get<string>('STORAGE_DRIVER', 'local') ?? 'local').toLowerCase() === 'local') {
    warnings.push('STORAGE_DRIVER=local loses uploads on ephemeral disks — prefer s3/R2');
  }

  for (const w of warnings) {
    logger.warn(w);
  }

  if (errors.length) {
    const message = `Production config invalid:\n- ${errors.join('\n- ')}`;
    logger.error(message);
    throw new Error(message);
  }
}
