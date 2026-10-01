import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'domo_at';
export const REFRESH_TOKEN_COOKIE = 'domo_rt';

const ACCESS_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  exposeTokensInBody(): boolean {
    return this.config.get('AUTH_EXPOSE_TOKENS_IN_BODY', 'false') === 'true';
  }

  private cookieBase() {
    const secure = this.config.get('COOKIE_SECURE', this.config.get('NODE_ENV') === 'production' ? 'true' : 'false') === 'true';
    const sameSite = (this.config.get('COOKIE_SAME_SITE', 'lax') as 'lax' | 'strict' | 'none') || 'lax';
    const domain = this.config.get<string>('COOKIE_DOMAIN')?.trim();
    return {
      httpOnly: true,
      secure,
      sameSite,
      ...(domain ? { domain } : {}),
    };
  }

  private refreshRememberMaxAgeMs(): number {
    const days = Number(this.config.get('JWT_REFRESH_EXPIRES_DAYS', '7'));
    if (!Number.isFinite(days) || days <= 0) return 7 * 24 * 60 * 60 * 1000;
    return days * 24 * 60 * 60 * 1000;
  }

  setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    options?: { rememberMe?: boolean },
  ): void {
    const base = this.cookieBase();
    const rememberMe = options?.rememberMe !== false;
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...base,
      path: '/api',
      maxAge: ACCESS_TTL_MS,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...base,
      path: '/api/v1/auth',
      ...(rememberMe ? { maxAge: this.refreshRememberMaxAgeMs() } : {}),
    });
  }

  clearAuthCookies(res: Response): void {
    const base = this.cookieBase();
    res.clearCookie(ACCESS_TOKEN_COOKIE, { ...base, path: '/api' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...base, path: '/api/v1/auth' });
  }

  wrapAuthResponse<T extends Record<string, unknown>>(
    res: Response,
    payload: T,
    options?: { forceExposeTokens?: boolean },
  ): T {
    const accessToken = payload.accessToken;
    const refreshToken = payload.refreshToken;
    if (typeof accessToken === 'string' && typeof refreshToken === 'string') {
      const rememberMe = payload.rememberMe !== false;
      this.setAuthCookies(res, accessToken, refreshToken, { rememberMe });
      if (!options?.forceExposeTokens && !this.exposeTokensInBody()) {
        const { accessToken: _a, refreshToken: _r, rememberMe: _m, ...rest } = payload;
        return rest as T;
      }
    }
    return payload;
  }
}
