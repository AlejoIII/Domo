import { ShieldOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { getRoutePermission } from '@/config/route-permissions';
import { usePermissions } from '@/hooks/usePermissions';

export function PermissionRoute({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { hasPermission } = usePermissions();
  const required = getRoutePermission(pathname);

  if (required && !hasPermission(required)) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <Card className="space-y-4 p-8 text-center">
          <ShieldOff className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h1 className="text-xl font-semibold">Sin acceso</h1>
          <p className="text-sm text-muted-foreground">
            No tienes permiso para ver esta sección. Contacta con un administrador si crees que
            deberías tener acceso.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Volver al panel
          </Link>
        </Card>
      </div>
    );
  }

  return children;
}
