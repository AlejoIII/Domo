import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Mail, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { EmailStatusBanner } from '@/features/settings/EmailStatusBanner';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import {
  cancelInvitation, createInvitation, fetchInvitations,
} from '@/services/settings.service';
import { fetchRoles } from '@/services/roles.service';
import { formatDate } from '@/lib/format';

export function InvitationsSection({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  // Solo el email cuenta como borrador; el rol vacío = empleado por defecto (sin marcar dirty)
  const { isDirty, resetBaseline } = useDraftDirty({ email }, 'invite');

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const invitationsQuery = useQuery({
    queryKey: ['settings', 'invitations'],
    queryFn: fetchInvitations,
  });
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: fetchRoles });

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation({ email, roleId: roleId || undefined }),
    onSuccess: () => {
      setEmail('');
      setRoleId('');
      resetBaseline({ email: '' });
      queryClient.invalidateQueries({ queryKey: ['settings', 'invitations'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'invitations'] }),
  });

  const inviteError = inviteMutation.isError
    ? (isAxiosError(inviteMutation.error)
      ? (inviteMutation.error.response?.data?.message ?? 'No se pudo crear la invitación.')
      : 'No se pudo crear la invitación.')
    : null;
  const cancelError =
    cancelMutation.isError ? 'No se pudo cancelar la invitación.' : null;

  const invitations = invitationsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const lastInvite = inviteMutation.data;

  return (
    <div className="space-y-4">
      <EmailStatusBanner />

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Invitar usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Envía un enlace de registro para unirse a tu empresa. Usa un email que aún no esté registrado.
          </p>
        </div>

        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@empresa.com"
          />
          <div className="space-y-1">
            <label className="text-sm font-medium">Rol</label>
            <select
              className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">Empleado (por defecto)</option>
              {roles
                .filter((r) => r.name.toLowerCase() !== 'admin')
                .map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </select>
          </div>
          <Button
            loading={inviteMutation.isPending}
            onClick={() => inviteMutation.mutate()}
            disabled={!email.trim()}
          >
            <Mail className="h-4 w-4" />
            Invitar
          </Button>
        </div>

        {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
        {cancelError && <p className="text-sm text-red-600">{cancelError}</p>}

        {inviteMutation.isSuccess && lastInvite && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
            {lastInvite.emailSent ? (
              <p className="text-emerald-700 dark:text-emerald-400">
                Email enviado a <strong>{lastInvite.email}</strong>.
              </p>
            ) : (
              <p className="text-amber-700 dark:text-amber-400">
                Invitación creada, pero no se pudo enviar el email
                {lastInvite.emailError ? `: ${lastInvite.emailError}` : '.'}
              </p>
            )}
            {(!lastInvite.emailSent || import.meta.env.DEV) && lastInvite.inviteUrl && (
              <p className="text-xs text-muted-foreground">
                Enlace manual:{' '}
                <code>{window.location.origin}{lastInvite.inviteUrl}</code>
              </p>
            )}
          </div>
        )}

        {invitationsQuery.isLoading ? (
          <div className="flex justify-center py-6"><Loader /></div>
        ) : invitationsQuery.isError ? (
          <p className="text-sm text-red-600">No se pudieron cargar las invitaciones.</p>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay invitaciones pendientes.</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.role?.name ?? 'Sin rol'} · expira {formatDate(inv.expiresAt)}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded p-2 text-red-600 hover:bg-red-500/10"
                  onClick={() => cancelMutation.mutate(inv.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
