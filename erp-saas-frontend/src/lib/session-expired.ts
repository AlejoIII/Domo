const SESSION_EXPIRED_KEY = 'domo-session-expired';

/** Marca que la sesión caducó antes de redirigir al login. */
export function markSessionExpired() {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
}

/** Lee y limpia el aviso de sesión caducada (solo una vez). */
export function consumeSessionExpired(): boolean {
  if (sessionStorage.getItem(SESSION_EXPIRED_KEY) !== '1') return false;
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  return true;
}

export const SESSION_EXPIRED_MESSAGE =
  'Tu sesión ha caducado por inactividad. Inicia sesión de nuevo para continuar.';
