import { Link, Navigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';

const plans = [
  {
    name: 'Free',
    price: '0 €',
    period: '/mes',
    description: 'Para probar Domo con tu equipo',
    features: ['Ventas y compras', 'Inventario básico', 'Hasta 2 usuarios'],
    cta: 'Empezar gratis',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '49 €',
    period: '/mes',
    description: 'Para crecer sin fricción',
    features: ['Informes avanzados', 'CRM y tesorería', 'Contabilidad básica', 'Sin marca de agua en PDF'],
    cta: 'Probar 14 días',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '149 €',
    period: '/mes',
    description: 'Operaciones complejas y API',
    features: ['Proyectos y fabricación', 'API y webhooks', 'Usuarios ilimitados', 'Soporte prioritario'],
    cta: 'Contactar ventas',
    href: '/contact',
    highlight: false,
  },
];

export function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-16 px-6 py-16">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Ventas, stock y facturación en un solo lugar
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Empieza en minutos. Escala cuando lo necesites.
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/register">
            <Button className="px-6 py-3 text-base">Crear cuenta gratis</Button>
          </Link>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">Planes</h2>
          <p className="mt-2 text-muted-foreground">14 días de Premium al registrarte</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col p-6 ${plan.highlight ? 'border-primary shadow-card ring-1 ring-primary/20' : ''}`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={plan.href} className="mt-6 block">
                <Button className="w-full" variant={plan.highlight ? 'primary' : 'secondary'}>
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
