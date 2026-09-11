import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpCircle, Users, FileText, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PLAN_FEATURE_LABELS, PLAN_UPGRADE_HINT } from '@/config/plan-features.config';

const COPY = {
  PLAN_LIMIT_USERS: {
    title: 'Límite de usuarios alcanzado',
    description: 'Tu plan actual no permite añadir más usuarios. Mejora tu plan para invitar a tu equipo.',
    icon: Users,
  },
  PLAN_LIMIT_DOCUMENTS: {
    title: 'Límite de documentos alcanzado',
    description: 'Has alcanzado el máximo de documentos permitidos este mes. Mejora tu plan para seguir creando pedidos, facturas y más.',
    icon: FileText,
  },
  PLAN_FEATURE_LOCKED: {
    title: 'Función no disponible en tu plan',
    description: 'Esta función requiere un plan superior. Consulta las opciones de mejora en facturación.',
    icon: Lock,
  },
} as const;

export function PlanLimitPage() {
  const [params] = useSearchParams();
  const code = params.get('code') as keyof typeof COPY | null;
  const limit = params.get('limit');
  const current = params.get('current');
  const feature = params.get('feature');
  const upgrade = params.get('upgrade');
  const config = (code && COPY[code]) || COPY.PLAN_LIMIT_DOCUMENTS;
  const Icon = config.icon;

  const featureLabel = feature ? PLAN_FEATURE_LABELS[feature] ?? feature : null;
  const upgradePlan = upgrade ?? (feature ? PLAN_UPGRADE_HINT[feature] : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg border-border/60 p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">{config.title}</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {code === 'PLAN_FEATURE_LOCKED' && featureLabel && upgradePlan
            ? `${featureLabel} está incluido en el plan ${upgradePlan} o superior.`
            : config.description}
        </p>
        {limit && current && (
          <p className="mb-6 text-sm font-medium">
            Uso: {current} / {limit}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/settings?tab=billing">
            <Button>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Ver planes y mejorar
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary">Volver al panel</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
