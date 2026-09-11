import type { AuthUser } from '@/services/auth.service';

/** Personalización de apariencia (paleta, radio, escala): Premium / Enterprise / trial. */
export function canCustomizeAppearance(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.subscriptionStatus === 'trialing') return true;
  const code = user.planCode?.toLowerCase();
  return code === 'pro' || code === 'enterprise';
}
