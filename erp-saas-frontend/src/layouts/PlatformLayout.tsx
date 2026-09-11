import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Building2, CreditCard, LayoutDashboard, Server, Shield, Users, FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Loader } from '@/components/ui/Loader';

const links = [
  { to: '/platform', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/platform/companies', label: 'Empresas', icon: Building2 },
  { to: '/platform/users', label: 'Usuarios', icon: Users },
  { to: '/platform/billing', label: 'Facturación', icon: CreditCard },
  { to: '/platform/beta', label: 'Beta', icon: FlaskConical },
  { to: '/platform/system', label: 'Sistema', icon: Server },
];

export function PlatformLayout() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-1 h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Administración de plataforma</h1>
          <p className="text-sm text-muted-foreground">Panel interno — no visible para clientes</p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Suspense fallback={<div className="flex justify-center py-10"><Loader /></div>}>
        <Outlet />
      </Suspense>
    </div>
  );
}
