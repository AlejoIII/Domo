import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LandingDashboardPreview } from '@/components/marketing/LandingDashboardPreview';
import { InstallAppButton } from '@/components/pwa/InstallAppButton';
import { useAuthStore } from '@/store/auth.store';

const exploreLinks = [
  { to: '/funcionalidades', label: 'Funcionalidades' },
  { to: '/precios', label: 'Precios' },
  { to: '/sobre-nosotros', label: 'Sobre nosotros' },
];

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:py-16">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-primary">
            ERP en la nube
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
            Ventas, stock y facturación en un solo lugar
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Domo es un sistema integral para gestionar tu negocio: pedidos, inventario, clientes e
            informes desde un único panel, sin hojas de cálculo ni herramientas sueltas.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button className="px-6 py-3 text-base shadow-soft">
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/funcionalidades">
              <Button variant="secondary" className="px-6 py-3 text-base">
                Ver funcionalidades
              </Button>
            </Link>
            <InstallAppButton variant="secondary" className="px-6 py-3 text-base" />
          </div>
          <div className="mt-5">
            <InstallAppButton showHelpWhenUnavailable />
          </div>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            Prueba gratis 14 días · Sin tarjeta de crédito
          </p>
          <nav
            aria-label="Explorar Domo"
            className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"
          >
            {exploreLinks.map((link, i) => (
              <span key={link.to} className="inline-flex items-center gap-4">
                {i > 0 && <span className="hidden text-border sm:inline">·</span>}
                <Link to={link.to} className="font-medium hover:text-primary">
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>

        <div className="lg:pl-2">
          <LandingDashboardPreview />
        </div>
      </section>
    </div>
  );
}
