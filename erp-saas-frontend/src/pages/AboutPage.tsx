import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { MarketingCta } from '@/components/marketing/MarketingCta';
import { marketingValues } from '@/lib/marketing-content';

const milestones = [
  {
    year: 'Hoy',
    title: 'ERP en la nube para PYMEs',
    text: 'Ventas, inventario, finanzas y CRM en un solo producto, actualizado de forma continua.',
  },
  {
    year: 'Enfoque',
    title: 'Adopción rápida',
    text: 'Onboarding guiado, datos de demo y planes que permiten empezar sin proyecto de meses.',
  },
  {
    year: 'Compromiso',
    title: 'Soporte cercano',
    text: 'Canal de contacto directo para dudas comerciales, técnicas y privacidad.',
  },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-6 py-14 sm:py-20">
      <MarketingPageHeader
        eyebrow="Empresa"
        title="Sobre nosotros"
        description="Domo nace para que las PYMEs tengan un ERP accesible: fácil de adoptar, con planes que crecen contigo y un equipo que responde cuando lo necesitas."
      />

      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-card p-8 shadow-sm">
          <h2 className="text-xl font-bold">Nuestra misión</h2>
          <p className="mt-4 text-muted-foreground">
            Simplificar la gestión diaria del negocio con software en la nube que no requiere un
            departamento de IT. Queremos que puedas facturar, controlar stock y entender tus números
            el mismo día que te registras.
          </p>
          <p className="mt-4 text-muted-foreground">
            Creemos en precios transparentes, funcionalidades que se desbloquean por plan y en
            escuchar a quienes usan Domo cada día para mejorar el producto.
          </p>
        </Card>
        <ul className="space-y-4">
          {milestones.map((m) => (
            <li
              key={m.title}
              className="flex gap-4 rounded-xl border border-border/60 bg-card/50 p-5 shadow-sm"
            >
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {m.year}
              </span>
              <div>
                <h3 className="font-semibold">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="values-heading">
        <div className="mb-8 max-w-2xl">
          <h2 id="values-heading" className="text-2xl font-bold">
            Lo que nos guía
          </h2>
          <p className="mt-2 text-muted-foreground">
            Principios que se notan en el producto y en cómo trabajamos contigo.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {marketingValues.map((v) => {
            const Icon = v.icon;
            return (
              <Card key={v.title} className="p-6 text-center shadow-sm sm:text-left">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary sm:mx-0">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-muted/20 px-6 py-8 text-center sm:px-10">
        <h2 className="text-xl font-bold">¿Quieres conocernos mejor?</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Escríbenos para una demo, un plan Enterprise a medida o cualquier pregunta sobre Domo.
        </p>
        <Link
          to="/contact"
          className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Ir a contacto →
        </Link>
      </section>

      <MarketingCta
        title="Empieza con Domo hoy"
        description="Cuenta gratis, trial Premium y migración progresiva sin cambiar de herramienta cada año."
      />
    </div>
  );
}
