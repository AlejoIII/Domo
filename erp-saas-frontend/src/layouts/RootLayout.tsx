import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { NavigationGuardProvider } from '@/contexts/NavigationGuardContext';
import { Loader } from '@/components/ui/Loader';

/** Envoltorio común a todas las ramas de rutas: chrome global dentro del router. */
export function RootLayout() {
  return (
    <NavigationGuardProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader /></div>}>
        <Outlet />
      </Suspense>
      <CookieConsent />
    </NavigationGuardProvider>
  );
}
