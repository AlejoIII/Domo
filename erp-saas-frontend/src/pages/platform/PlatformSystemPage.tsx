import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import {
  fetchFailedWebhooks,
  fetchPlatformAudit,
  fetchPlatformSettings,
  fetchPlatformSystemStatus,
  retryPlatformWebhook,
  updatePlatformMaintenance,
} from '@/services/platform.service';
import { cn } from '@/lib/cn';
import { formatAuditAction, formatAuditTargetType } from '@/lib/format-audit';

export function PlatformSystemPage() {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({ queryKey: ['platform', 'system'], queryFn: fetchPlatformSystemStatus });
  const settingsQuery = useQuery({ queryKey: ['platform', 'settings'], queryFn: fetchPlatformSettings });
  const failedQuery = useQuery({ queryKey: ['platform', 'webhooks-failed'], queryFn: fetchFailedWebhooks });
  const auditQuery = useQuery({ queryKey: ['platform', 'audit-full'], queryFn: () => fetchPlatformAudit(50) });

  const [message, setMessage] = useState('');
  const settings = settingsQuery.data;
  const draftMessage = message || settings?.maintenanceMessage || '';
  const { isDirty, markClean } = useDraftDirty(
    { message: draftMessage },
    settings ? 'maintenance-loaded' : 'maintenance-pending',
  );
  const { dialog } = useUnsavedChangesGuard(isDirty);

  const maintenanceMutation = useMutation({
    mutationFn: ({ on, msg }: { on: boolean; msg?: string }) =>
      updatePlatformMaintenance(on, msg),
    onSuccess: () => {
      markClean();
      queryClient.invalidateQueries({ queryKey: ['platform'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryPlatformWebhook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform', 'webhooks-failed'] }),
  });

  if (statusQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader /></div>;
  }

  const s = statusQuery.data;

  return (
    <div className="space-y-6">
      {dialog}
      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Estado del sistema</h3>
        {s && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(['database', 'redis', 'storage', 'stripe', 'email'] as const).map((k) => (
              <div key={k} className="flex justify-between rounded bg-muted/40 px-3 py-2 text-sm">
                <span className="capitalize">{k}</span>
                <span className={cn(s[k] === 'connected' || s[k] === 'configured' || s[k] === 'local' ? 'text-green-600' : 'text-amber-600')}>
                  {s[k]}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Modo mantenimiento</h3>
        <p className="text-sm text-muted-foreground">
          Bloquea login y registro de clientes (platform admin puede entrar).
        </p>
        <Input
          placeholder="Mensaje para usuarios (opcional)"
          value={message || settings?.maintenanceMessage || ''}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            variant="danger"
            loading={maintenanceMutation.isPending}
            onClick={() => maintenanceMutation.mutate({ on: true, msg: message })}
          >
            Activar mantenimiento
          </Button>
          <Button
            variant="secondary"
            loading={maintenanceMutation.isPending}
            disabled={!settings?.maintenanceMode}
            onClick={() => maintenanceMutation.mutate({ on: false })}
          >
            Desactivar
          </Button>
        </div>
        {settings?.maintenanceMode && (
          <p className="text-sm text-amber-600">Mantenimiento ACTIVO</p>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Webhooks fallidos</h3>
        <ul className="space-y-2 text-sm">
          {(failedQuery.data ?? []).map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 rounded bg-muted/40 px-3 py-2">
              <div>
                <p>{w.event} · {w.endpoint.company.name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-md">{w.endpoint.url}</p>
              </div>
              <Button className="px-3 py-1.5 text-xs" variant="secondary" loading={retryMutation.isPending} onClick={() => retryMutation.mutate(w.id)}>
                Reintentar
              </Button>
            </li>
          ))}
          {!failedQuery.data?.length && (
            <li className="text-muted-foreground">No hay entregas fallidas recientes</li>
          )}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Log de auditoría</h3>
        <ul className="max-h-96 space-y-1 overflow-y-auto text-sm">
          {(auditQuery.data ?? []).map((a) => (
            <li key={a.id} className="rounded bg-muted/30 px-2 py-1">
              <span className="font-medium">{formatAuditAction(a.action)}</span>
              {' · '}{formatAuditTargetType(a.targetType)}
              {' · '}{new Date(a.createdAt).toLocaleString('es-ES')}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
