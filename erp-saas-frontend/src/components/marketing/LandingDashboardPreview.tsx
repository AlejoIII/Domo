import { useState } from 'react';
import { LandingDashboardPreviewStatic } from '@/components/marketing/LandingDashboardPreviewStatic';

/** Captura 2x del panel (generar con npm run screenshots:marketing). */
const DASHBOARD_HERO = '/marketing/dashboard-hero.png';

/** Vista del panel en la landing: captura real con fallback estático nítido. */
export function LandingDashboardPreview() {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <LandingDashboardPreviewStatic />;
  }

  return (
    <div className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
      <div
        className="pointer-events-none absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-primary/15 via-transparent to-primary/5"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card ring-1 ring-black/[0.04] dark:ring-white/10">
        <img
          src={DASHBOARD_HERO}
          alt="Panel de Domo con resumen de ventas, alertas de stock y actividad reciente"
          width={1280}
          height={720}
          className="block h-auto w-full select-none object-cover object-left-top"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
          onError={() => setUseFallback(true)}
        />
      </div>
    </div>
  );
}
