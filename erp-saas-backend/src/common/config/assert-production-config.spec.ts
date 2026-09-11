import { ConfigService } from '@nestjs/config';
import { assertProductionConfig } from './assert-production-config';

function cfg(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string, defaultValue?: string) =>
      (values[key] !== undefined ? values[key] : defaultValue) as string | undefined,
  } as ConfigService;
}

describe('assertProductionConfig', () => {
  it('skips checks outside production', () => {
    expect(() =>
      assertProductionConfig(cfg({ NODE_ENV: 'development', JWT_SECRET: 'x' })),
    ).not.toThrow();
  });

  it('rejects weak JWT secrets in production', () => {
    expect(() =>
      assertProductionConfig(
        cfg({
          NODE_ENV: 'production',
          JWT_SECRET: 'change-me-in-production',
          JWT_REFRESH_SECRET: 'also-change-me-refresh-in-production-long',
        }),
      ),
    ).toThrow(/JWT_SECRET/);
  });

  it('accepts strong secrets in production', () => {
    expect(() =>
      assertProductionConfig(
        cfg({
          NODE_ENV: 'production',
          JWT_SECRET: 'a'.repeat(32) + '-strong-secret-value',
          JWT_REFRESH_SECRET: 'b'.repeat(32) + '-strong-refresh-value',
          FRONTEND_URL: 'https://app.example.com',
          COOKIE_SECURE: 'true',
          REDIS_URL: 'redis://localhost:6379',
          EMAIL_PROVIDER: 'resend',
          EMAIL_VERIFICATION_ENABLED: 'true',
          STORAGE_DRIVER: 's3',
        }),
      ),
    ).not.toThrow();
  });
});
