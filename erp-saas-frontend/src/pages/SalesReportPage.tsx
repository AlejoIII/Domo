import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { exportSalesReport, fetchSalesReport } from '@/services/reports.service';
import { formatMoney } from '@/lib/format';
import { ORDER_STATUS_LABELS, statusBadgeVariant, statusLabel } from '@/lib/documentStatus';

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export function SalesReportPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ from: defaultFrom(), to: defaultTo() });
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'sales', applied],
    queryFn: () => fetchSalesReport(applied),
  });

  const maxClientTotal = useMemo(
    () => Math.max(1, ...(data?.topClients.map((c) => c.total) ?? [1])),
    [data],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Informe de ventas</h1>
        <p className="text-sm text-muted-foreground">Pedidos, presupuestos y clientes</p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button onClick={() => setApplied({ from, to })}>Aplicar</Button>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="secondary"
            loading={exporting === 'csv'}
            onClick={async () => {
              setExporting('csv');
              setExportError(null);
              try {
                await exportSalesReport({ ...applied, format: 'csv' });
              } catch (err) {
                setExportError(err instanceof Error ? err.message : 'Error al exportar CSV');
              } finally {
                setExporting(null);
              }
            }}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="secondary"
            loading={exporting === 'xlsx'}
            onClick={async () => {
              setExporting('xlsx');
              setExportError(null);
              try {
                await exportSalesReport({ ...applied, format: 'xlsx' });
              } catch (err) {
                setExportError(err instanceof Error ? err.message : 'Error al exportar Excel');
              } finally {
                setExporting(null);
              }
            }}
          >
            <Download className="h-4 w-4" />
            Excel
          </Button>
        </div>
        {exportError && (
          <p className="w-full text-sm text-red-600 sm:col-span-full">{exportError}</p>
        )}
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : isError || !data ? (
        <Card className="p-6">
          <p className="text-sm text-red-600">No se pudo cargar el informe de ventas.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Pedidos" value={String(data.summary.ordersCount)} />
            <Kpi label="Importe pedidos" value={formatMoney(data.summary.ordersTotal)} />
            <Kpi label="Presupuestos" value={String(data.summary.quotesCount)} />
            <Kpi
              label="Conversión presupuestos"
              value={`${data.summary.conversionRate}%`}
              hint={`${data.summary.acceptedQuotes} aceptados`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-border/60 px-4 py-3">
                <h2 className="font-semibold">Pedidos por estado</h2>
              </div>
              {data.byStatus.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Sin datos en el periodo.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Estado</th>
                      <th className="px-4 py-2 font-medium">Cantidad</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byStatus.map((row) => (
                      <tr key={row.status} className="border-b border-border/30">
                        <td className="px-4 py-2">
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {statusLabel(ORDER_STATUS_LABELS, row.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">{row.count}</td>
                        <td className="px-4 py-2 text-right">{formatMoney(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card className="p-4">
              <h2 className="mb-4 font-semibold">Top clientes</h2>
              {data.topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin pedidos en el periodo.</p>
              ) : (
                <ul className="space-y-3">
                  {data.topClients.map((c) => (
                    <li key={c.clientId}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{c.clientName}</span>
                        <span>{formatMoney(c.total)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${(c.total / maxClientTotal) * 100}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.orders} pedidos</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="font-semibold">Últimos pedidos</h2>
            </div>
            {data.recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Sin pedidos.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Número</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-border/30">
                      <td className="px-4 py-2">
                        <Link to={`/orders/${o.id}`} className="font-medium text-primary hover:underline">
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{o.client?.name ?? '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {o.orderDate?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={statusBadgeVariant(o.status)}>
                          {statusLabel(ORDER_STATUS_LABELS, o.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{formatMoney(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
