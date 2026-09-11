import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/Card';

import { Loader } from '@/components/ui/Loader';

import {

  fetchPlatformAudit,

  fetchPlatformMetrics,

  fetchPlatformStats,

} from '@/services/platform.service';

import { formatAuditAction, formatAuditTargetType } from '@/lib/format-audit';



export function PlatformDashboardPage() {

  const statsQuery = useQuery({ queryKey: ['platform', 'stats'], queryFn: fetchPlatformStats });

  const metricsQuery = useQuery({ queryKey: ['platform', 'metrics'], queryFn: fetchPlatformMetrics });

  const auditQuery = useQuery({ queryKey: ['platform', 'audit'], queryFn: () => fetchPlatformAudit(15) });



  if (statsQuery.isLoading) {

    return <div className="flex justify-center py-12"><Loader /></div>;

  }



  const stats = statsQuery.data;

  const metrics = metricsQuery.data;



  return (

    <div className="space-y-6">

      {stats && (

        <div className="grid gap-4 sm:grid-cols-4">

          {[

            { label: 'Empresas', value: stats.companies },

            { label: 'Activas', value: stats.activeCompanies },

            { label: 'Suspendidas', value: stats.suspendedCompanies },

            { label: 'Usuarios', value: stats.users },

          ].map((s) => (

            <Card key={s.label} className="p-4">

              <p className="text-xs text-muted-foreground">{s.label}</p>

              <p className="text-2xl font-bold">{s.value}</p>

            </Card>

          ))}

        </div>

      )}



      {metrics && (

        <>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Card className="p-4">

              <p className="text-xs text-muted-foreground">Registros (30 días)</p>

              <p className="text-2xl font-bold">{metrics.signupsLast30Days}</p>

            </Card>

            <Card className="p-4">

              <p className="text-xs text-muted-foreground">Onboarding completado</p>

              <p className="text-2xl font-bold">{metrics.onboardingComplete}</p>

              <p className="text-xs text-muted-foreground">{metrics.onboardingPending} pendientes</p>

            </Card>

            <Card className="p-4">

              <p className="text-xs text-muted-foreground">En trial</p>

              <p className="text-2xl font-bold">{metrics.trialingCount}</p>

            </Card>

            <Card className="p-4">

              <p className="text-xs text-muted-foreground">Pagos activos (Stripe)</p>

              <p className="text-2xl font-bold">{metrics.activePaidCount}</p>

            </Card>

          </div>



          <div className="grid gap-4 sm:grid-cols-3">

            <Card className="p-4">

              <p className="text-xs text-muted-foreground">Empresas beta</p>

              <p className="text-2xl font-bold">{metrics.betaCohortCount}</p>

              {metrics.registration.betaSignupCap != null && (

                <p className="text-xs text-muted-foreground">

                  Cupo: {metrics.registration.betaSignupCount}/{metrics.registration.betaSignupCap}

                </p>

              )}

            </Card>

            <Card className="p-4">

              <p className="text-xs text-muted-foreground">Usuarios activos (7 días)</p>

              <p className="text-2xl font-bold">{metrics.activeUsersLast7Days}</p>

            </Card>

            <Card className="p-4">

              <p className="text-xs text-muted-foreground">Feedback recibido</p>

              <p className="text-2xl font-bold">{metrics.feedbackCount}</p>

            </Card>

          </div>



          <div className="grid gap-4 sm:grid-cols-2">

            <Card className="p-4">

              <p className="mb-2 text-xs text-muted-foreground">Por plan</p>

              <ul className="space-y-1 text-sm">

                {metrics.byPlan.map((p) => (

                  <li key={p.planCode} className="flex justify-between">

                    <span>{p.planName}</span>

                    <span className="font-medium">{p.count}</span>

                  </li>

                ))}

              </ul>

            </Card>

            <Card className="p-4">

              <p className="mb-2 text-xs text-muted-foreground">Por cohorte beta</p>

              <ul className="space-y-1 text-sm">

                {metrics.byCohort.length ? metrics.byCohort.map((c) => (

                  <li key={c.cohort} className="flex justify-between">

                    <span>{c.cohort}</span>

                    <span className="font-medium">{c.count}</span>

                  </li>

                )) : (

                  <li className="text-muted-foreground">Sin cohortes registradas</li>

                )}

              </ul>

            </Card>

          </div>

        </>

      )}



      <Card className="p-4">

        <h3 className="mb-3 font-semibold">Auditoría reciente</h3>

        <ul className="space-y-2 text-sm">

          {(auditQuery.data ?? []).map((a) => (

            <li key={a.id} className="flex justify-between gap-2 rounded bg-muted/40 px-3 py-2">

              <span>{formatAuditAction(a.action)} · {formatAuditTargetType(a.targetType)}</span>

              <span className="shrink-0 text-muted-foreground">

                {new Date(a.createdAt).toLocaleString('es-ES')}

              </span>

            </li>

          ))}

          {!auditQuery.data?.length && (

            <li className="text-muted-foreground">Sin acciones registradas aún</li>

          )}

        </ul>

        <div className="mt-3 flex flex-wrap gap-4 text-sm">

          <Link to="/platform/beta" className="text-primary hover:underline">

            Gestionar beta →

          </Link>

          <Link to="/platform/system" className="text-primary hover:underline">

            Sistema y mantenimiento →

          </Link>

        </div>

      </Card>

    </div>

  );

}


