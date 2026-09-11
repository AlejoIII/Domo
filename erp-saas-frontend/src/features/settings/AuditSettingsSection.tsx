import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { formatDateTime } from '@/lib/format';
import { fetchAuditLogs } from '@/services/audit.service';
import { formatAuditAction, formatAuditContext } from '@/lib/format-audit';

export function AuditSettingsSection() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => fetchAuditLogs({ page, limit: 20 }),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Auditoría</h2>
        <p className="text-sm text-muted-foreground">Registro de acciones en el sistema</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader /></div>
      ) : isError ? (
        <p className="text-sm text-red-600">No se pudo cargar la auditoría.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin registros todavía.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {items.map((log) => (
            <li key={log.id} className="space-y-1 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{formatAuditAction(log.action)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {log.user?.email ?? 'Sistema'}
                {formatAuditContext(log.entity, log.entityId)
                  ? ` · ${formatAuditContext(log.entity, log.entityId)}`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
