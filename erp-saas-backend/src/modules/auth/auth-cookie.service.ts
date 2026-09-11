import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'domo_at';
export const REFRESH_TOKEN_COOKIE = 'domo_rt';

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const base = this.cookieBase();
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...base,
      path: '/api',
      maxAge: ACCESS_TTL_MS,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...base,
      path: '/api/v1/auth',
      maxAge: REFRESH_TTL_MS,
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
      this.setAuthCookies(res, accessToken, refreshToken);
      if (!options?.forceExposeTokens && !this.exposeTokensInBody()) {
        const { accessToken: _a, refreshToken: _r, ...rest } = payload;
        return rest as T;
      }
    }
    return payload;
  }
}
