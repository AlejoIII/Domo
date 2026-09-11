import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Download, UserX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { anonymizeClient, downloadClientDataExport } from '@/services/privacy.service';
import { usePermissions } from '@/hooks/usePermissions';

interface ClientPrivacySectionProps {
  clientId: string;
  clientName: string;
  anonymizedAt?: string | null;
}

export function ClientPrivacySection({
  clientId,
  clientName,
  anonymizedAt,
}: ClientPrivacySectionProps) {
  const queryClient = useQueryClient();
  const { canWrite } = usePermissions();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: () => downloadClientDataExport(clientId, clientName),
    onError: () => setError('No se pudo generar el export'),
  });

  const anonymizeMutation = useMutation({
    mutationFn: () => anonymizeClient(clientId, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setReason('');
      setError(null);
    },
    onError: (err) => {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'No se pudo anonimizar el cliente')
          : 'No se pudo anonimizar el cliente',
      );
    },
  });

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Privacidad</h2>
          <p className="text-sm text-muted-foreground">Derechos de acceso y supresión (RGPD)</p>
        </div>
        {anonymizedAt && <Badge variant="muted">Anonimizado</Badge>}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <Button
        variant="secondary"
        loading={exportMutation.isPending}
        onClick={() => {
          setError(null);
          exportMutation.mutate();
        }}
      >
        <Download className="h-4 w-4" />
        Exportar sus datos
      </Button>

      {canWrite('clients') && !anonymizedAt && (
        <form
          className="space-y-3 border-t border-border/60 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (
              !confirm(
                'Se borrarán nombre, NIF, dirección, email, teléfono y notas de este cliente. Las facturas se conservan por obligación fiscal. ¿Continuar?',
              )
            ) {
              return;
            }
            anonymizeMutation.mutate();
          }}
        >
          <h3 className="font-medium">Suprimir datos personales</h3>
          <p className="text-sm text-muted-foreground">
            Las facturas y asientos contables se conservan durante el periodo legal de retención,
            sin datos identificativos del interesado.
          </p>
          <Input
            label="Motivo de la solicitud"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Solicitud del interesado, art. 17 RGPD…"
          />
          <Button type="submit" variant="danger" loading={anonymizeMutation.isPending}>
            <UserX className="h-4 w-4" />
            Anonimizar cliente
          </Button>
        </form>
      )}
    </Card>
  );
}
