import { Suspense } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';

export function AuthLayout() {
  return (
    <div className="domo-gradient flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-6">
        <Suspense fallback={<div className="flex justify-center py-10"><Loader /></div>}>
          <Outlet />
        </Suspense>
      </div>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        <Link to="/contact" className="hover:underline">Contacto</Link>
        {' · '}
        <Link to="/terms" className="hover:underline">Términos</Link>
        {' · '}
        <Link to="/privacy" className="hover:underline">Privacidad</Link>
        {' · '}
        <Link to="/" className="hover:underline">Domo</Link>
      </footer>
    </div>
  );
}
