import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { MarketingCta } from '@/components/marketing/MarketingCta';
import { PricingComparisonTable } from '@/components/marketing/PricingComparisonTable';
import { marketingPlans } from '@/lib/marketing-plans';
import { marketingFaqs } from '@/lib/marketing-content';

export function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-6 py-14 sm:py-20">
      <MarketingPageHeader
        align="center"
        eyebrow="Precios"
        title="Planes que se adaptan a tu negocio"
        description="Empieza gratis, prueba Premium 14 días al registrarte y escala a Enterprise cuando necesites API, fabricación o soporte dedicado."
        className="mx-auto"
      />

      <section aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="sr-only">
          Planes
        </h2>
        <div className="grid gap-6 md:grid-cols-3 md:items-stretch">
          {marketingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col p-6 shadow-sm transition hover:shadow-md ${plan.highlight ? 'border-primary shadow-card ring-1 ring-primary/20 md:-mt-1 md:mb-1' : ''}`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Más popular</Badge>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-5">
                <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={plan.href} className="mt-8 block">
                <Button className="w-full" variant={plan.highlight ? 'primary' : 'secondary'}>
                  {plan.cta}
                </Button>
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">{plan.footnote}</p>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Precios orientativos en EUR. IVA no incluido.{' '}
          <Link to="/contact" className="font-medium text-primary hover:underline">
            Consulta condiciones Enterprise
          </Link>
        </p>
      </section>

      <section aria-labelledby="compare-heading" className="space-y-6">
        <MarketingPageHeader
          title="Comparativa detallada"
          description="Resumen rápido de lo que incluye cada plan."
        />
        <PricingComparisonTable />
      </section>

      <section aria-labelledby="faq-heading" className="space-y-6">
        <MarketingPageHeader
          title="Preguntas frecuentes"
          description="Dudas habituales antes de crear la cuenta."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {marketingFaqs.map((faq) => (
            <Card key={faq.q} className="p-5 shadow-sm">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <MarketingCta />
    </div>
  );
}
