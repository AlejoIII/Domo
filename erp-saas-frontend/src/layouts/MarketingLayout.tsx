import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

export function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-semibold text-primary">Domo</Link>
          <nav className="flex items-center gap-2">
            <Link to="/#pricing" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Precios
            </Link>
            <Link to="/contact" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Contacto
            </Link>
            <Link to="/status" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Estado
            </Link>
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button>Probar gratis</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Loader /></div>}>
          <Outlet />
        </Suspense>
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
