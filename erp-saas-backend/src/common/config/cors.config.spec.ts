import { resolveCorsOrigin } from './cors.config';

describe('resolveCorsOrigin', () => {
  const config = (values: Record<string, string | undefined>) => ({
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  });

  it('allows localhost in development', () => {
    expect(resolveCorsOrigin(config({ NODE_ENV: 'development', CORS_ORIGIN: 'http://localhost:5173' }) as never)).toBe(
      'http://localhost:5173',
    );
  });

  it('parses comma-separated origins', () => {
    expect(
      resolveCorsOrigin(
        config({
          NODE_ENV: 'production',
          CORS_ORIGIN: 'https://app.example.com,https://admin.example.com',
        }) as never,
      ),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('throws in production when origin is wildcard', () => {
    expect(() =>
      resolveCorsOrigin(config({ NODE_ENV: 'production', CORS_ORIGIN: '*' }) as never),
    ).toThrow(/CORS_ORIGIN/);
  });
});
