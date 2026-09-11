import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export function OnboardingGate() {
  const user = useAuthStore((s) => s.user);

  if (user && user.onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
