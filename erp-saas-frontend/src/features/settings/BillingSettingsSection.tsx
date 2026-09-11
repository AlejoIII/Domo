import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpCircle, CreditCard, ExternalLink, FileText, Users } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import {
  createBillingCheckout,
  createBillingPortal,
  fetchBillingPlans,
  fetchBillingStatus,
  fetchBillingUsage,
  switchDemoPlan,
} from '@/services/billing.service';
import { cn } from '@/lib/cn';
import { useAuthReady } from '@/hooks/useAuthReady';

function UsageBar({
  label,
  current,
  max,
  icon: Icon,
}: {
  label: string;
  current: number;
  max: number | null;
  icon: typeof Users;
}) {
  const pct = max ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const atLimit = max != null && current >= max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className={cn(atLimit && 'text-amber-600')}>
          {current}
          {max != null ? ` / ${max}` : ' (ilimitado)'}
        </span>
      </div>
      {max != null && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', atLimit ? 'bg-amber-500' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function BillingSettingsSection() {
  const queryClient = useQueryClient();
  const authReady = useAuthReady();

  const usageQuery = useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: fetchBillingUsage,
    enabled: authReady,
    staleTime: 60_000,
    retry: (count, error) => {
      if (isAxiosError(error) && error.response?.status === 429) return false;
      return count < 1;
    },
  });
  const statusQuery = useQuery({
    queryKey: ['billing', 'status'],
    queryFn: fetchBillingStatus,
    enabled: authReady,
    staleTime: 60_000,
    retry: (count, error) => {
      if (isAxiosError(error) && error.response?.status === 429) return false;
      return count < 1;
    },
  });
  const plansQuery = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: fetchBillingPlans,
    enabled: authReady,
    staleTime: 60_000,
    retry: (count, error) => {
      if (isAxiosError(error) && error.response?.status === 429) return false;
      return count < 1;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (planCode: string) => createBillingCheckout(planCode),
    onSuccess: (data) => {
      if (data.url) window.location.assign(data.url);
    },
  });

  const portalMutation = useMutation({
    mutationFn: createBillingPortal,
    onSuccess: (data) => {
      if (data.url) window.location.assign(data.url);
    },
  });

  const demoPlanMutation = useMutation({
    mutationFn: switchDemoPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'navigation'] });
    },
  });

  if (usageQuery.isLoading || statusQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    );
  }

  const usage = usageQuery.data;
  const status = statusQuery.data;
  if (!usage) {
    return <p className="text-sm text-muted-foreground">No se pudo cargar la información del plan.</p>;
  }

  const currentPlanOrder =
    (plansQuery.data ?? []).find((plan) => plan.code === usage.plan.code)?.sortOrder ?? 0;

  const isTrialing = usage.subscriptionStatus === 'trialing';
  const stripeEnabled = status?.stripeEnabled ?? false;
  const demoPlanSwitchEnabled = status?.demoPlanSwitchEnabled ?? false;
  const checkoutError = checkoutMutation.error || portalMutation.error;
  const demoPlanError = demoPlanMutation.error;
  const errorMessage = isAxiosError(checkoutError)
    ? (checkoutError.response?.data?.message ?? 'No se pudo iniciar el pago')
    : null;
  const demoPlanErrorMessage = isAxiosError(demoPlanError)
    ? (demoPlanError.response?.data?.message ?? 'No se pudo cambiar el plan')
    : null;

  const handleUpgrade = (planCode: string) => {
    checkoutMutation.mutate(planCode, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['billing'] });
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan actual</p>
            <h3 className="text-xl font-semibold">{usage.plan.name}</h3>
            {isTrialing && usage.trialEndsAt && (
              <p className="mt-1 text-sm text-amber-600">
                Periodo de prueba hasta {new Date(usage.trialEndsAt).toLocaleDateString('es-ES')}
              </p>
            )}
            {usage.subscriptionStatus === 'past_due' && (
              <p className="mt-1 text-sm text-red-600">Pago pendiente — actualiza tu método de pago</p>
            )}
          </div>
          <CreditCard className="h-8 w-8 text-primary/70" />
        </div>

        <div className="space-y-4">
          <UsageBar
            label="Usuarios"
            current={usage.usage.users}
            max={usage.plan.maxUsers}
            icon={Users}
          />
          <UsageBar
            label="Documentos este mes"
            current={usage.usage.documentsThisMonth}
            max={usage.plan.maxDocuments}
            icon={FileText}
          />
        </div>

        {stripeEnabled && status?.hasStripeCustomer && !demoPlanSwitchEnabled && (
          <Button
            className="mt-4"
            variant="secondary"
            loading={portalMutation.isPending}
            onClick={() => portalMutation.mutate()}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Gestionar suscripción
          </Button>
        )}
      </Card>

      <Card className="border-border/60 p-6">
        <h3 className="mb-1 font-semibold">
          {demoPlanSwitchEnabled ? 'Planes disponibles' : 'Mejorar plan'}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {demoPlanSwitchEnabled
            ? 'Selecciona un plan para probar funcionalidades. El cambio es inmediato y no requiere pago.'
            : stripeEnabled
              ? 'Elige un plan superior. El pago se procesa de forma segura con Stripe.'
              : 'Configura STRIPE_SECRET_KEY y los price IDs en el servidor para activar pagos online.'}
        </p>

        {demoPlanMutation.isSuccess && (
          <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {demoPlanMutation.data.message}
          </p>
        )}
        {demoPlanErrorMessage && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {demoPlanErrorMessage}
          </p>
        )}
        {errorMessage && !demoPlanSwitchEnabled && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {(plansQuery.data ?? []).map((plan) => {
            const isCurrent = plan.code === usage.plan.code;
            const canUpgrade =
              !demoPlanSwitchEnabled
              && stripeEnabled
              && plan.purchasable
              && !isCurrent
              && plan.sortOrder > currentPlanOrder;

            return (
              <div
                key={plan.id}
                className={cn(
                  'rounded-lg border p-4',
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border',
                )}
              >
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.maxUsers} usuarios ·{' '}
                  {plan.maxDocuments != null ? `${plan.maxDocuments} docs/mes` : 'docs ilimitados'}
                </p>
                {isCurrent ? (
                  <p className="mt-3 text-xs font-medium text-primary">Plan actual</p>
                ) : demoPlanSwitchEnabled ? (
                  <Button
                    className="mt-3 w-full"
                    variant="secondary"
                    loading={demoPlanMutation.isPending}
                    onClick={() => demoPlanMutation.mutate(plan.code)}
                  >
                    Activar {plan.name}
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="mt-3 w-full"
                    loading={checkoutMutation.isPending}
                    onClick={() => handleUpgrade(plan.code)}
                  >
                    <ArrowUpCircle className="mr-1 h-3 w-3" />
                    Mejorar a {plan.name}
                  </Button>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {plan.code === 'free' ? 'Plan base' : 'No disponible online'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
