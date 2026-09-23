import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Stamp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import {
  fetchVerifactuRecords,
  fetchVerifactuSettings,
  updateVerifactuSettings,
  type VerifactuSettings,
} from '@/services/verifactu.service';

function apiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    if (err.code === 'ECONNABORTED') return 'Tiempo de espera agotado. ¿Está la API en marcha?';
    if (!err.response) return 'No hay respuesta del servidor. Revisa que la API escuche en :3000.';
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'No se pudo guardar';
}

export function VerifactuSettingsSection({
  canWrite,
  onDirtyChange,
}: {
  canWrite: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['verifactu', 'settings'],
    queryFn: fetchVerifactuSettings,
  });
  const recordsQuery = useQuery({
    queryKey: ['verifactu', 'records'],
    queryFn: () => fetchVerifactuRecords(20),
  });

  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<'verifactu' | 'no_verificable'>('verifactu');
  const [nif, setNif] = useState('');
  const [certificatePem, setCertificatePem] = useState('');
  const [certificatePassword, setCertificatePassword] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = settingsQuery.data;
    if (!s) return;
    const next = {
      enabled: s.enabled,
      mode: (s.mode === 'no_verificable' ? 'no_verificable' : 'verifactu') as
        | 'verifactu'
        | 'no_verificable',
      nif: s.nif ?? '',
    };
    setEnabled(next.enabled);
    setMode(next.mode);
    setNif(next.nif);
    setHydrated(true);
  }, [settingsQuery.data]);

  const draft = { enabled, mode, nif, certificatePem, certificatePassword };
  const { isDirty, markClean, resetBaseline } = useDraftDirty(
    draft,
    hydrated ? 'verifactu-settings-ready' : 'verifactu-settings-loading',
  );

  useEffect(() => {
    if (!hydrated || !settingsQuery.data) return;
    resetBaseline({
      enabled: settingsQuery.data.enabled,
      mode: settingsQuery.data.mode === 'no_verificable' ? 'no_verificable' : 'verifactu',
      nif: settingsQuery.data.nif ?? '',
      certificatePem: '',
      certificatePassword: '',
    });
    // Solo al hidratar desde servidor la primera vez / cada fetch de settings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, settingsQuery.dataUpdatedAt]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateVerifactuSettings({
        enabled,
        mode,
        nif: nif.trim() || undefined,
        ...(certificatePem.trim()
          ? {
              certificatePem: certificatePem.trim(),
              certificatePassword: certificatePassword || undefined,
            }
          : {}),
      }),
    onSuccess: (data: VerifactuSettings) => {
      setCertificatePem('');
      setCertificatePassword('');
      const clean = {
        enabled: data.enabled,
        mode: (data.mode === 'no_verificable' ? 'no_verificable' : 'verifactu') as
          | 'verifactu'
          | 'no_verificable',
        nif: data.nif ?? '',
        certificatePem: '',
        certificatePassword: '',
      };
      setEnabled(clean.enabled);
      setMode(clean.mode);
      setNif(clean.nif);
      markClean(clean);
      queryClient.setQueryData(['verifactu', 'settings'], data);
      void queryClient.invalidateQueries({ queryKey: ['verifactu', 'records'] });
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <Card className="border-border/60 p-6">
        <p className="text-sm text-red-600">
          No se pudieron cargar los ajustes Verifactu: {apiErrorMessage(settingsQuery.error)}
        </p>
      </Card>
    );
  }

  const settings = settingsQuery.data;

  return (
    <div className="space-y-6">
      <FormRequiredLegend />
      <Card className="border-border/60 p-6">
        <div className="mb-4 flex items-start gap-3">
          <Stamp className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Verifactu / SIF</h3>
            <p className="text-sm text-muted-foreground">
              Encadenado de registros y remisión a la AEAT (esqueleto). Off por defecto.
              Software: {settings?.software.name} {settings?.software.version}.
            </p>
          </div>
        </div>

        {!settings?.secretsKeyConfigured && (
          <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            El servidor no tiene <code>VERIFACTU_SECRETS_KEY</code>. Puedes activar el modo
            sin certificado; subirlo requerirá esa clave.
          </p>
        )}

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              disabled={!canWrite}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Activar Verifactu en esta empresa
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Modo</label>
              <select
                className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
                value={mode}
                disabled={!canWrite}
                onChange={(e) => setMode(e.target.value as 'verifactu' | 'no_verificable')}
              >
                <option value="verifactu">VERI*FACTU (remisión AEAT)</option>
                <option value="no_verificable">No verificable (local)</option>
              </select>
            </div>
            <Input
              label="NIF emisor"
              value={nif}
              disabled={!canWrite}
              onChange={(e) => setNif(e.target.value)}
              placeholder="B12345678"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Certificado (PEM / texto)</label>
            <textarea
              className="min-h-24 w-full rounded-lg border border-border/70 bg-card px-3 py-2 font-mono text-xs"
              value={certificatePem}
              disabled={!canWrite}
              onChange={(e) => setCertificatePem(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE----- …"
            />
            <Input
              label="Contraseña del certificado"
              type="password"
              value={certificatePassword}
              disabled={!canWrite || !certificatePem}
              onChange={(e) => setCertificatePassword(e.target.value)}
            />
            {settings?.hasCertificate && (
              <p className="text-xs text-muted-foreground">
                Certificado cargado (huella {settings.certificateFingerprint}).
              </p>
            )}
          </div>

          {settings?.chain && (
            <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm">
              Cadena: {settings.chain.recordCount} registros
              {settings.chain.lastHuella
                ? ` · última huella ${settings.chain.lastHuella.slice(0, 16)}…`
                : ''}
              {settings.chain.pendingRemits
                ? ` · ${settings.chain.pendingRemits} pendientes de remisión`
                : ''}
            </div>
          )}

          {canWrite && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                loading={saveMutation.isPending}
                disabled={!isDirty || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                Guardar Verifactu
              </Button>
            </div>
          )}
          {saveMutation.isSuccess && !isDirty && (
            <p className="text-sm text-green-700 dark:text-green-400">Ajustes guardados.</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-red-600">{apiErrorMessage(saveMutation.error)}</p>
          )}
        </div>
      </Card>

      <Card className="border-border/60 p-6">
        <h3 className="mb-3 font-semibold">Últimos registros</h3>
        {recordsQuery.isLoading ? (
          <Loader />
        ) : recordsQuery.isError ? (
          <p className="text-sm text-red-600">{apiErrorMessage(recordsQuery.error)}</p>
        ) : (recordsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay registros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Serie</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 pr-3">AEAT</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recordsQuery.data?.map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="py-2 pr-3">{r.sequenceNo}</td>
                    <td className="py-2 pr-3">{r.numSerieFactura}</td>
                    <td className="py-2 pr-3">{r.invoiceType ?? r.recordType}</td>
                    <td className="py-2 pr-3">{r.aeatStatus}</td>
                    <td className="py-2">{new Date(r.createdAt).toLocaleString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
