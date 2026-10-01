import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface MarketingCtaProps {
  title?: string;
  description?: string;
}

export function MarketingCta({
  title = '¿Listo para probar Domo?',
  description = 'Crea tu cuenta en minutos. Sin tarjeta de crédito y con 14 días de Premium incluidos.',
}: MarketingCtaProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-10">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link to="/register">
            <Button className="px-6">
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="secondary">Hablar con ventas</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
