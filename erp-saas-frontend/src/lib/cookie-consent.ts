const STORAGE_KEY = 'domo-cookie-consent';

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  updatedAt: string;
};

export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

export function setCookieConsent(analytics: boolean): CookieConsent {
  const value: CookieConsent = {
    essential: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  return value;
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}
