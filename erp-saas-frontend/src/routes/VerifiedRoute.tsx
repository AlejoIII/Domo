import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export function VerifiedRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user?.emailVerified) return <Navigate to="/verify-email" replace />;
  return <Outlet />;
}
