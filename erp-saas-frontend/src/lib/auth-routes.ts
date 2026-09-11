import type { AuthUser } from '@/services/auth.service';

export function getPostAuthPath(user?: AuthUser | null) {
  if (user?.onboardingCompleted === false) return '/onboarding';
  return '/dashboard';
}
