import { Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { MarketingCta } from '@/components/marketing/MarketingCta';
import { marketingFeatureModules, marketingWorkflowSteps } from '@/lib/marketing-content';
import { marketingFeatureHighlights as quickList } from '@/lib/marketing-plans';

export function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-6 py-14 sm:py-20">
      <MarketingPageHeader
        eyebrow="Producto"
        title="Funcionalidades"
        description="Domo reúne ventas, stock, finanzas y equipo en un ERP en la nube pensado para PYMEs. Sin integraciones frágiles entre hojas de cálculo y apps sueltas."
      />

      <section aria-labelledby="highlights-heading">
        <h2 id="highlights-heading" className="sr-only">
          Resumen
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {quickList.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3.5 shadow-sm"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="text-sm font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="modules-heading">
        <div className="mb-8 max-w-2xl">
          <h2 id="modules-heading" className="text-2xl font-bold">
            Módulos principales
          </h2>
          <p className="mt-2 text-muted-foreground">
            Cada área del negocio comparte los mismos clientes, productos y documentos.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {marketingFeatureModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.title} className="flex flex-col p-6 shadow-sm transition hover:border-primary/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{mod.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{mod.description}</p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-border/50 pt-4 text-sm">
                  {mod.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="workflow-heading">
        <div className="mb-8 max-w-2xl">
          <h2 id="workflow-heading" className="text-2xl font-bold">
            Cómo empezar
          </h2>
          <p className="mt-2 text-muted-foreground">
            Un flujo simple para pasar de cero a facturar con tu equipo.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {marketingWorkflowSteps.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="relative rounded-xl border border-border/60 bg-muted/20 p-5"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Paso {item.step}
                </span>
                <div className="mt-3 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <MarketingCta
        title="Explora Domo con tu propio entorno"
        description="Regístrate gratis y prueba Premium 14 días con datos de demo o los tuyos."
      />
    </div>
  );
}
