import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import {
  TrendingUp, Users, Package, DollarSign, AlertTriangle, Receipt,
  Truck, Target, ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchDashboardStats } from '@/services/dashboard.service';
import { formatMoney } from '@/lib/format';
import { SalesChart } from '@/components/charts/SalesChart';
import { SalesFlowGuide } from '@/components/dashboard/SalesFlowGuide';
import { ORDER_STATUS_LABELS, statusBadgeVariant, statusLabel } from '@/lib/documentStatus';
import { cn } from '@/lib/cn';

function KpiCard({
  label,
  value,
  icon: Icon,
  to,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  to: string;
  hint?: string;
}) {
  return (
    <Link to={to} className="group block">
      <Card className="p-5 transition hover:border-primary/40 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
          Ver listado
          <ArrowUpRight className="h-3 w-3" />
        </p>
      </Card>
    </Link>
  );
}

function ActionWidget({
  title,
  value,
  subtitle,
  to,
  linkLabel,
  icon: Icon,
  tone = 'amber',
}: {
  title: string;
  value: string;
  subtitle: string;
  to: string;
  linkLabel: string;
  icon: LucideIcon;
  tone?: 'amber' | 'blue' | 'emerald';
}) {
  const toneClass = {
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-200',
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-200',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200',
  }[tone];

  return (
    <Card className={cn('p-4', toneClass)}>
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-sm opacity-80">{subtitle}</p>
          <Link to={to} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {linkLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
  });

  const recentOrders = data?.recentOrders ?? [];
  const lowStockProducts = data?.lowStockProducts ?? [];
  const lowStockCount = data?.lowStockCount ?? 0;
  const overdueCount = data?.overdueInvoicesCount ?? 0;
  const overdueAmount = data?.overdueInvoicesAmount ?? 0;
  const ordersToShip = data?.ordersToShip ?? 0;
  const monthlySales = data?.monthlySales ?? 0;
  const monthlyTarget = data?.monthlySalesTarget;
  const monthlyProgress = data?.monthlySalesProgress;

  const kpis = [
    {
      label: 'Ingresos facturados',
      value: data ? formatMoney(data.revenue ?? 0) : '—',
      icon: DollarSign,
      to: '/invoices?status=paid',
      hint: 'Facturas pagadas y emitidas',
    },
    {
      label: 'Clientes',
      value: data ? String(data.clients ?? 0) : '—',
      icon: Users,
      to: '/clients',
    },
    {
      label: 'Productos',
      value: data ? String(data.products ?? 0) : '—',
      icon: Package,
      to: '/products',
    },
    {
      label: 'Pedidos',
      value: data ? String(data.orders ?? 0) : '—',
      icon: TrendingUp,
      to: '/orders',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : isError ? (
        <Card className="space-y-3 p-6">
          <p className="text-sm text-red-600">No se pudieron cargar las estadísticas del dashboard.</p>
          <Button variant="secondary" onClick={() => refetch()}>Reintentar</Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overdueCount > 0 && (
              <ActionWidget
                title="Facturas vencidas"
                value={formatMoney(overdueAmount)}
                subtitle={`${overdueCount} factura${overdueCount === 1 ? '' : 's'} con saldo pendiente`}
                to="/invoices?overdue=1"
                linkLabel="Ver vencidas"
                icon={Receipt}
                tone="amber"
              />
            )}
            {ordersToShip > 0 && (
              <ActionWidget
                title="Pedidos por enviar"
                value={String(ordersToShip)}
                subtitle="Confirmados pendientes de envío"
                to="/orders?status=confirmed"
                linkLabel="Ver pedidos"
                icon={Truck}
                tone="blue"
              />
            )}
            {lowStockCount > 0 && (
              <ActionWidget
                title="Stock bajo"
                value={String(lowStockCount)}
                subtitle="Productos bajo mínimo"
                to="/products?lowStock=1"
                linkLabel="Ver inventario"
                icon={AlertTriangle}
                tone="amber"
              />
            )}
            <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex gap-3">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-200" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-100">
                    Ventas del mes
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-50">
                    {formatMoney(monthlySales)}
                  </p>
                  {monthlyTarget != null && monthlyTarget > 0 ? (
                    <>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950/10">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${Math.min(monthlyProgress ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-emerald-800/80 dark:text-emerald-100/80">
                        {monthlyProgress ?? 0}% de {formatMoney(monthlyTarget)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sin objetivo mensual configurado
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Link to="/reports/sales" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      Informe ventas
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link to="/settings?tab=documents" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      {monthlyTarget ? 'Editar meta' : 'Configurar meta'}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {lowStockCount > 0 && lowStockProducts.length > 0 && (
            <Card className="p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Productos con stock crítico</p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {lowStockProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <Link to={`/products/${p.id}`} className="min-w-0 truncate font-medium hover:text-primary">
                      {p.code} · {p.name}
                    </Link>
                    <Badge variant={p.stock === 0 ? 'danger' : 'default'}>
                      {p.stock}/{p.minStock}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <SalesFlowGuide />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <KpiCard {...kpi} />
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Actividad reciente</h2>
                <Link to="/orders" className="text-xs text-primary hover:underline">
                  Ver pedidos
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pedidos recientes.</p>
              ) : (
                <ul className="space-y-3">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-medium hover:text-primary"
                        >
                          Pedido {order.number}
                        </Link>
                        <p className="truncate text-muted-foreground">
                          {order.client?.name ?? 'Sin cliente'} · {formatMoney(order.total)}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {statusLabel(ORDER_STATUS_LABELS, order.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="mb-4 font-semibold">Ventas y cobros (6 meses)</h2>
              <SalesChart data={data?.chart ?? []} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
