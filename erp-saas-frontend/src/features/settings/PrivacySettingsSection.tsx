import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import {
  deleteCompanyData,
  downloadCompanyDataExport,
  fetchRetentionPolicy,
} from '@/services/privacy.service';

export function PrivacySettingsSection() {
  const { isAdmin } = usePermissions();
  const logout = useAuthStore((s) => s.logout);
  const companyName = useAuthStore((s) => s.user?.companyName ?? '');
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: policy, isLoading } = useQuery({
    queryKey: ['privacy', 'retention'],
    queryFn: fetchRetentionPolicy,
  });

  const nameMatches = useMemo(() => {
    const typed = confirmation.trim();
    if (!typed) return false;
    if (!companyName) return typed.length >= 2;
    return typed === companyName.trim();
  }, [confirmation, companyName]);

  const canSubmitDelete = nameMatches && acknowledged;

  const exportMutation = useMutation({
    mutationFn: downloadCompanyDataExport,
    onError: () => setError('No se pudo generar el export de datos'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCompanyData(confirmation, reason || undefined),
    onSuccess: () => {
      setConfirmOpen(false);
      logout();
      window.location.assign('/');
    },
    onError: (err) => {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'No se pudo completar la baja')
          : 'No se pudo completar la baja',
      );
      setConfirmOpen(false);
    },
  });

  const openConfirm = () => {
    setError(null);
    if (!confirmation.trim()) {
      setError('Escribe el nombre de la empresa para continuar');
      return;
    }
    if (companyName && !nameMatches) {
      setError('El nombre no coincide con el de tu empresa');
      return;
    }
    setAcknowledged(false);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (deleteMutation.isPending) return;
    setConfirmOpen(false);
    setAcknowledged(false);
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Privacidad y datos</h2>
          <p className="text-sm text-muted-foreground">
            Ejerce los derechos de acceso, portabilidad y supresión (RGPD)
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="rounded-lg border border-border/60 p-4">
          <h3 className="font-medium">Exportar todos los datos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Descarga un archivo JSON con clientes, productos, documentos, cobros y usuarios de la
            empresa. Válido como copia de portabilidad.
          </p>
          {isAdmin ? (
            <Button
              className="mt-3"
              variant="secondary"
              loading={exportMutation.isPending}
              onClick={() => {
                setError(null);
                exportMutation.mutate();
              }}
            >
              <Download className="h-4 w-4" />
              Descargar export
            </Button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Solo el administrador de la cuenta puede exportar todos los datos.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border/60 p-4">
          <h3 className="font-medium">Supresión de datos de un cliente</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            La anonimización de un cliente concreto se realiza desde su ficha. Las facturas y
            asientos asociados se conservan por obligación fiscal.
          </p>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <div>
          <h2 className="text-lg font-semibold">Política de retención</h2>
          <p className="text-sm text-muted-foreground">
            Cuánto tiempo conservamos cada categoría de datos y por qué
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader /></div>
        ) : !policy ? (
          <p className="text-sm text-muted-foreground">No se pudo cargar la política.</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {policy.categories.map((item) => (
              <li key={item.category} className="space-y-1 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{item.category}</span>
                  <Badge variant={item.erasable ? 'default' : 'muted'}>
                    {item.erasable ? 'Suprimible' : 'Conservación obligatoria'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {item.retention} · {item.basis}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isAdmin && (
        <Card className="space-y-4 border-red-500/40 p-6">
          <div>
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Dar de baja la cuenta
            </h2>
            <p className="text-sm text-muted-foreground">
              Solo el administrador de la cuenta puede realizar la baja. Se desactiva la empresa y
              se anonimizan todos los usuarios. La documentación fiscal queda bloqueada durante{' '}
              {policy?.fiscalRetentionYears ?? 6} años y después se elimina. Esta acción no se
              puede deshacer.
            </p>
          </div>

          <div className="space-y-3">
            <Input
              label="Escribe el nombre exacto de la empresa"
              placeholder={companyName || 'Nombre de tu empresa'}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
            {companyName && confirmation.trim() && !nameMatches && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Debe coincidir exactamente con «{companyName}».
              </p>
            )}
            <Input
              label="Motivo de la baja"
              optionalHint
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Cierre de actividad, cambio de herramienta…"
            />
            <Button
              type="button"
              variant="danger"
              disabled={!confirmation.trim()}
              onClick={openConfirm}
            >
              <Trash2 className="h-4 w-4" />
              Continuar con la baja…
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        title="Confirmar baja de cuenta"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Vas a dar de baja{companyName ? ` «${companyName}»` : ' tu empresa'}.
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Todos los usuarios perderán el acceso de inmediato.</li>
                <li>Los datos personales se anonimizarán o suprimirán.</li>
                <li>
                  La documentación fiscal se conserva bloqueada{' '}
                  {policy?.fiscalRetentionYears ?? 6} años.
                </li>
                <li>No se puede deshacer.</li>
              </ul>
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-border/60 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={deleteMutation.isPending}
            />
            <span>
              Entiendo que esta acción es permanente y quiero dar de baja la cuenta.
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={deleteMutation.isPending}
              onClick={closeConfirm}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={!canSubmitDelete}
              onClick={() => {
                setError(null);
                deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" />
              Dar de baja y suprimir datos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
