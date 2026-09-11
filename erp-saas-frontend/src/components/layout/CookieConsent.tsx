import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { getCookieConsent, setCookieConsent } from '@/lib/cookie-consent';
import { initSentry } from '@/lib/sentry.config';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent) {
      initSentry({ analytics: consent.analytics });
      return;
    }
    setVisible(true);
  }, []);

  const save = (analytics: boolean) => {
    setCookieConsent(analytics);
    initSentry({ analytics });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border/70 bg-card/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Usamos cookies esenciales para la sesión y, si lo aceptas, analítica para mejorar Domo.{' '}
          <Link to="/cookies" className="text-primary hover:underline">Más info</Link>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="secondary" onClick={() => save(false)}>
            Solo esenciales
          </Button>
          <Button onClick={() => save(true)}>
            Aceptar todo
          </Button>
        </div>
      </div>
    </div>
  );
}
