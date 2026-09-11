import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  createBetaInvite,
  fetchBetaFeedback,
  fetchBetaInvites,
  fetchBetaRegistrationSettings,
  revokeBetaInvite,
  updateBetaRegistrationSettings,
} from '@/services/platform.service';

export function PlatformBetaPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('beta-2026');
  const [cap, setCap] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ['platform', 'beta', 'registration'],
    queryFn: fetchBetaRegistrationSettings,
    retry: (count, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) return false;
      return count < 1;
    },
  });
  const invitesQuery = useQuery({
    queryKey: ['platform', 'beta', 'invites'],
    queryFn: fetchBetaInvites,
    retry: (count, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) return false;
      return count < 1;
    },
  });
  const feedbackQuery = useQuery({
    queryKey: ['platform', 'beta', 'feedback'],
    queryFn: () => fetchBetaFeedback(30),
    staleTime: 60_000,
    retry: (count, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) return false;
      return count < 1;
    },
  });

  const settingsMutation = useMutation({
    mutationFn: updateBetaRegistrationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['platform', 'beta', 'registration'], data);
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: ['platform', 'beta', 'registration'],
        exact: true,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createBetaInvite({
      email: email.trim() || undefined,
      label: label.trim() || undefined,
    }),
    onSuccess: (invite) => {
      setCreatedUrl(invite.registerUrl);
      setEmail('');
      queryClient.invalidateQueries({
        queryKey: ['platform', 'beta', 'invites'],
        exact: true,
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeBetaInvite,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['platform', 'beta', 'invites'],
      exact: true,
    }),
  });

  if (settingsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader /></div>;
  }

  const settings = settingsQuery.data;
  const inviteOnly = settings?.mode === 'invite_only';

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Registro beta</h3>
          <p className="text-sm text-muted-foreground">
            Controla si el registro público está abierto o requiere invitación.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={inviteOnly ? 'primary' : 'secondary'}
            onClick={() => settingsMutation.mutate({ registrationMode: 'invite_only' })}
            loading={settingsMutation.isPending}
            disabled={settingsMutation.isPending}
          >
            Solo invitación
          </Button>
          <Button
            variant={!inviteOnly ? 'primary' : 'secondary'}
            onClick={() => settingsMutation.mutate({ registrationMode: 'open' })}
            loading={settingsMutation.isPending}
            disabled={settingsMutation.isPending}
          >
            Registro abierto
          </Button>
        </div>
        {settingsMutation.isError && (
          <p className="text-sm text-destructive">
            No se pudo actualizar el modo de registro. Inténtalo de nuevo.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Input
            label="Cupo de empresas beta (vacío = sin límite)"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            placeholder={settings?.betaSignupCap?.toString() ?? '10'}
          />
          <Button
            variant="secondary"
            onClick={() => settingsMutation.mutate({
              betaSignupCap: cap.trim() ? Number.parseInt(cap, 10) : null,
            })}
            loading={settingsMutation.isPending}
          >
            Guardar cupo
          </Button>
        </div>

        {settings && (
          <p className="text-sm text-muted-foreground">
            Empresas beta: {settings.betaSignupCount}
            {settings.betaSignupCap != null ? ` / ${settings.betaSignupCap}` : ''}
            {settings.signupCapReached ? ' — cupo alcanzado' : ''}
          </p>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Nueva invitación</h3>
          <p className="text-sm text-muted-foreground">
            Genera un enlace único para registrar una empresa en la beta.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Email (opcional, bloquea el registro)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="beta@empresa.com"
          />
          <Input
            label="Cohorte"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="julio-2026"
          />
        </div>

        <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
          Crear invitación
        </Button>

        {createdUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{createdUrl}</span>
            <button
              type="button"
              className="rounded p-1 hover:bg-muted"
              onClick={() => navigator.clipboard.writeText(createdUrl)}
              title="Copiar enlace"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Invitaciones</h3>
        <ul className="space-y-2 text-sm">
          {(invitesQuery.data ?? []).map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-muted/40 px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium">{invite.label} · {invite.usedCount}/{invite.maxUses} usos</p>
                <p className="truncate text-muted-foreground">
                  {invite.email ?? 'Cualquier email'}
                  {invite.company ? ` → ${invite.company.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={invite.isActive ? 'text-emerald-600' : 'text-muted-foreground'}>
                  {invite.isActive ? 'Activa' : 'Inactiva'}
                </span>
                {invite.isActive && (
                  <button
                    type="button"
                    className="rounded p-1 text-red-600 hover:bg-muted"
                    onClick={() => revokeMutation.mutate(invite.id)}
                    title="Revocar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
          {!invitesQuery.data?.length && (
            <li className="text-muted-foreground">Sin invitaciones creadas</li>
          )}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Feedback reciente</h3>
        <ul className="space-y-3 text-sm">
          {(feedbackQuery.data ?? []).map((item) => (
            <li key={item.id} className="rounded bg-muted/40 px-3 py-2">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{item.company.name}</span>
                <span className="text-muted-foreground">
                  {item.rating != null ? `${item.rating}/5 · ` : ''}
                  {new Date(item.createdAt).toLocaleString('es-ES')}
                </span>
              </div>
              <p>{item.message}</p>
              {item.page && <p className="mt-1 text-xs text-muted-foreground">{item.page}</p>}
            </li>
          ))}
          {!feedbackQuery.data?.length && (
            <li className="text-muted-foreground">Aún no hay feedback</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
