import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import {
  fetchPlatformCompany,
  fetchPlatformPlans,
  impersonateCompany,
  setPlatformCompanyStatus,
  updatePlatformCompanyNotes,
  updatePlatformCompanyPlan,
  updatePlatformCompanyTrial,
} from '@/services/platform.service';
import { useAuthStore } from '@/store/auth.store';
import { useImpersonationStore } from '@/store/impersonation.store';

export function PlatformCompanyDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const authUser = useAuthStore((s) => s.user);
  const setBackup = useImpersonationStore((s) => s.setBackup);

  const companyQuery = useQuery({
    queryKey: ['platform', 'company', id],
    queryFn: () => fetchPlatformCompany(id),
    enabled: !!id,
  });

  const plansQuery = useQuery({ queryKey: ['platform', 'plans'], queryFn: fetchPlatformPlans });

  const [notes, setNotes] = useState('');
  const [trialDate, setTrialDate] = useState('');
  const [planCode, setPlanCode] = useState('');

  const c = companyQuery.data;

  const draftValues = c
    ? {
        notes: notes || c.platformNotes || '',
        trialDate: trialDate || (c.trialEndsAt ? c.trialEndsAt.slice(0, 10) : ''),
        planCode: planCode || c.plan?.code || 'free',
      }
    : { notes: '', trialDate: '', planCode: 'free' };
  const { isDirty, markClean } = useDraftDirty(draftValues, c?.id ?? 'pending');
  const { requestLeave, dialog } = useUnsavedChangesGuard(isDirty);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['platform'] });

  const planMutation = useMutation({
    mutationFn: (code: string) => updatePlatformCompanyPlan(id, code),
    onSuccess: () => {
      markClean();
      invalidate();
    },
  });

  const trialMutation = useMutation({
    mutationFn: (date: string) => updatePlatformCompanyTrial(id, new Date(date).toISOString()),
    onSuccess: () => {
      markClean();
      invalidate();
    },
  });

  const notesMutation = useMutation({
    mutationFn: () => updatePlatformCompanyNotes(id, notes || c?.platformNotes || ''),
    onSuccess: () => {
      markClean();
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (isActive: boolean) => setPlatformCompanyStatus(id, isActive),
    onSuccess: invalidate,
  });

  const impersonateMutation = useMutation({
    mutationFn: (userId?: string) => impersonateCompany(id, userId),
    onSuccess: (data) => {
      if (authUser && data.accessToken && data.refreshToken) {
        setBackup({ user: authUser, accessToken: data.accessToken, refreshToken: data.refreshToken });
      }
      if (data.user) {
        setSession(data.user);
      }
      navigate('/dashboard');
    },
  });

  if (companyQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader /></div>;
  }

  if (!c) return <p>Empresa no encontrada</p>;

  return (
    <div className="space-y-4">
      {dialog}
      <Button
        variant="secondary"
        className="px-3 py-1.5 text-xs"
        onClick={() => requestLeave(() => navigate('/platform/companies'))}
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver
      </Button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{c.name}</h2>
            <p className="text-sm text-muted-foreground">{c.slug} · {c.email ?? '—'}</p>
            <p className="mt-2 text-sm">Plan: <strong>{c.planName}</strong> · {c.subscriptionStatus}</p>
            <p className="text-sm text-muted-foreground">
              Uso: {c.usage.usage.users}/{c.usage.plan.maxUsers} usuarios ·{' '}
              {c.usage.usage.documentsThisMonth}/{c.usage.plan.maxDocuments ?? '∞'} docs/mes
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              loading={impersonateMutation.isPending}
              onClick={() => impersonateMutation.mutate(undefined)}
            >
              <LogIn className="mr-1 h-4 w-4" /> Entrar como empresa
            </Button>
            <Button
              variant={c.isActive ? 'danger' : 'secondary'}
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(!c.isActive)}
            >
              {c.isActive ? 'Suspender' : 'Reactivar'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Cambiar plan</h3>
          <select
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            value={planCode || c.plan?.code || 'free'}
            onChange={(e) => setPlanCode(e.target.value)}
          >
            {(plansQuery.data ?? []).map((p) => (
              <option key={p.id} value={p.code}>{p.name}</option>
            ))}
          </select>
          <Button
            className="px-3 py-1.5 text-xs"
            loading={planMutation.isPending}
            onClick={() => planMutation.mutate(planCode || c.plan?.code || 'free')}
          >
            Guardar plan
          </Button>
        </Card>

        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Extender trial</h3>
          <Input
            type="date"
            value={trialDate || (c.trialEndsAt ? c.trialEndsAt.slice(0, 10) : '')}
            onChange={(e) => setTrialDate(e.target.value)}
          />
          <Button
            className="px-3 py-1.5 text-xs"
            loading={trialMutation.isPending}
            disabled={!trialDate}
            onClick={() => trialMutation.mutate(trialDate)}
          >
            Actualizar trial
          </Button>
        </Card>
      </div>

      <Card className="space-y-3 p-4">
        <h3 className="font-semibold">Notas internas</h3>
        <textarea
          className="min-h-24 w-full rounded-lg border border-border bg-card p-3 text-sm"
          value={notes || c.platformNotes || ''}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas solo visibles para platform admin…"
        />
        <Button className="px-3 py-1.5 text-xs" loading={notesMutation.isPending} onClick={() => notesMutation.mutate()}>
          Guardar notas
        </Button>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Usuarios</h3>
        <ul className="divide-y">
          {c.users.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{u.email}</p>
                <p className="text-xs text-muted-foreground">{u.role?.name ?? '—'}</p>
              </div>
              <Button
                className="px-3 py-1.5 text-xs"
                variant="secondary"
                loading={impersonateMutation.isPending}
                onClick={() => impersonateMutation.mutate(u.id)}
              >
                Entrar como
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {(c.stripeCustomerId || c.stripeSubscriptionId) && (
        <Card className="p-4 text-sm text-muted-foreground">
          <p>Stripe customer: {c.stripeCustomerId ?? '—'}</p>
          <p>Stripe subscription: {c.stripeSubscriptionId ?? '—'}</p>
        </Card>
      )}
    </div>
  );
}
