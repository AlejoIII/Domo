import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DomoLogo } from '@/components/brand/DomoLogo';
import { InstallAppButton } from '@/components/pwa/InstallAppButton';

const navLinkClass =
  'hidden text-sm text-muted-foreground hover:text-foreground md:inline';

export function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <Link to="/" className="flex shrink-0 items-center">
            <DomoLogo className="h-8" decorative={false} />
          </Link>
          <nav className="flex flex-1 items-center justify-center gap-3 lg:gap-6">
            <Link to="/funcionalidades" className={navLinkClass}>
              Funcionalidades
            </Link>
            <Link to="/precios" className={navLinkClass}>
              Precios
            </Link>
            <Link to="/status" className={navLinkClass}>
              Recursos
            </Link>
            <Link to="/sobre-nosotros" className={navLinkClass}>
              Sobre nosotros
            </Link>
            <Link to="/contact" className={navLinkClass}>
              Contacto
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <InstallAppButton variant="ghost" className="hidden md:inline-flex" />
            <Link to="/login" className="hidden sm:inline">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link to="/register">
              <Button>Crear cuenta gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm text-muted-foreground">
          <span>Domo © {new Date().getFullYear()}</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/contact" className="hover:text-foreground">Contacto</Link>
            <Link to="/terms" className="hover:text-foreground">Términos</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacidad</Link>
            <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
            <Link to="/status" className="hover:text-foreground">Estado del servicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
