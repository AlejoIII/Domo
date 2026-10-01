const REMEMBER_FLAG_KEY = 'domo-login-remember-me';
const REMEMBER_EMAIL_KEY = 'domo-login-email';

export function loadLoginRememberMe(): boolean {
  try {
    return localStorage.getItem(REMEMBER_FLAG_KEY) === 'true';
  } catch {
    return true;
  }
}

export function loadRememberedEmail(): string {
  try {
    if (localStorage.getItem(REMEMBER_FLAG_KEY) !== 'true') return '';
    return localStorage.getItem(REMEMBER_EMAIL_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function persistLoginPreferences(email: string, rememberMe: boolean): void {
  try {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
      localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBER_FLAG_KEY);
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}
