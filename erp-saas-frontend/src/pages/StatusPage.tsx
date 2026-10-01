import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { MarketingPageHeader } from '@/components/marketing/MarketingPageHeader';
import { cn } from '@/lib/cn';
import { fetchPublicStatus } from '@/services/status.service';

const labels: Record<string, string> = {
  ok: 'Operativo',
  degraded: 'Degradado',
  error: 'Incidencia',
  skipped: 'N/D',
};

export function StatusPage() {
  const query = useQuery({
    queryKey: ['public-status'],
    queryFn: fetchPublicStatus,
    refetchInterval: 60_000,
  });

  const data = query.data;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-14 sm:py-20">
      <MarketingPageHeader
        eyebrow="Recursos"
        title="Estado del servicio"
        description="Disponibilidad de Domo y componentes principales. Esta página se actualiza automáticamente cada minuto."
      />

      {query.isLoading && (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      )}

      {query.isError && (
        <Card className="p-6 text-sm text-red-600 shadow-sm">
          No se pudo comprobar el estado. Inténtalo más tarde o{' '}
          <Link to="/contact" className="font-medium underline">
            contáctanos
          </Link>
          .
        </Card>
      )}

      {data && (
        <Card className="space-y-5 p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <span className="font-semibold">Estado general</span>
            <StatusBadge status={data.status} />
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
              <span>API</span>
              <StatusBadge status={data.components.api} />
            </li>
            <li className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
              <span>Base de datos</span>
              <StatusBadge status={data.components.database} />
            </li>
            <li className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2">
              <span>Redis</span>
              <StatusBadge status={data.components.redis} />
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Última comprobación: {new Date(data.timestamp).toLocaleString('es-ES')}
          </p>
        </Card>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link to="/contact" className="text-primary hover:underline">
          Reportar una incidencia
        </Link>
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = labels[status] ?? status;
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'ok' && 'bg-success/15 text-success',
        status === 'degraded' && 'bg-amber-500/15 text-amber-700 dark:text-amber-200',
        status === 'error' && 'bg-red-500/15 text-red-600',
        status === 'skipped' && 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}
