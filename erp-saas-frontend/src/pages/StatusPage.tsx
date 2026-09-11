import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
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
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">Estado del servicio</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Disponibilidad de Domo. Se actualiza cada minuto.
      </p>

      {query.isLoading && (
        <div className="flex justify-center py-12"><Loader /></div>
      )}

      {query.isError && (
        <Card className="mt-6 p-4 text-sm text-red-600">
          No se pudo comprobar el estado. Inténtalo más tarde.
        </Card>
      )}

      {data && (
        <Card className="mt-6 space-y-4 p-6">
          <div className="flex items-center justify-between">
            <span className="font-medium">Estado general</span>
            <StatusBadge status={data.status} />
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>API</span>
              <StatusBadge status={data.components.api} />
            </li>
            <li className="flex justify-between">
              <span>Base de datos</span>
              <StatusBadge status={data.components.database} />
            </li>
            <li className="flex justify-between">
              <span>Redis</span>
              <StatusBadge status={data.components.redis} />
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Última comprobación: {new Date(data.timestamp).toLocaleString('es-ES')}
          </p>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'ok'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : status === 'degraded'
        ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
        : 'bg-red-500/10 text-red-700 dark:text-red-400';

  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', tone)}>
      {labels[status] ?? status}
    </span>
  );
}
