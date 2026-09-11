import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useIdleSessionTimeout } from '@/hooks/useIdleSessionTimeout';
import { Loader } from '@/components/ui/Loader';

export function PlatformAdminRoute() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useIdleSessionTimeout(isAuthenticated && !!user?.isPlatformAdmin);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user.isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
