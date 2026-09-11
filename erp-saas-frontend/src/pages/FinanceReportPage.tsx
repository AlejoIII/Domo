import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { exportFinanceReport, fetchFinanceReport } from '@/services/reports.service';
import { formatMoney } from '@/lib/format';
import {
  INVOICE_STATUS_LABELS,
  PO_STATUS_LABELS,
  statusBadgeVariant,
  statusLabel,
} from '@/lib/documentStatus';

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export function FinanceReportPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [applied, setApplied] = useState({ from: defaultFrom(), to: defaultTo() });
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'finance', applied],
    queryFn: () => fetchFinanceReport(applied),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Informe financiero</h1>
        <p className="text-sm text-muted-foreground">Facturación, cobros y compras</p>
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
                await exportFinanceReport({ ...applied, format: 'csv' });
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
                await exportFinanceReport({ ...applied, format: 'xlsx' });
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
          <p className="text-sm text-red-600">No se pudo cargar el informe financiero.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Facturado" value={formatMoney(data.summary.billed)} hint="Emitidas y parciales" />
            <Kpi label="Cobrado" value={formatMoney(data.summary.collected)} hint="Pagos en el periodo" />
            <Kpi label="Pendiente de cobro" value={formatMoney(data.summary.outstanding)} hint="Saldo pendiente" />
            <Kpi label="IVA repercutido" value={formatMoney(data.summary.taxCollected)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Compras (todas)" value={formatMoney(data.summary.purchasesTotal)} />
            <Kpi label="Compras recibidas" value={formatMoney(data.summary.purchasesReceived)} />
            <Kpi
              label="Margen estimado"
              value={formatMoney(data.summary.margin)}
              hint="Facturado − compras recibidas"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-border/60 px-4 py-3">
                <h2 className="font-semibold">Facturas por estado</h2>
              </div>
              {data.invoicesByStatus.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Sin facturas en el periodo.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Estado</th>
                      <th className="px-4 py-2 font-medium">Cant.</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                      <th className="px-4 py-2 font-medium text-right">IVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoicesByStatus.map((row) => (
                      <tr key={row.status} className="border-b border-border/30">
                        <td className="px-4 py-2">
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {statusLabel(INVOICE_STATUS_LABELS, row.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">{row.count}</td>
                        <td className="px-4 py-2 text-right">{formatMoney(row.total)}</td>
                        <td className="px-4 py-2 text-right">{formatMoney(row.tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-border/60 px-4 py-3">
                <h2 className="font-semibold">Órdenes de compra por estado</h2>
              </div>
              {data.purchasesByStatus.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Sin órdenes de compra en el periodo.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Estado</th>
                      <th className="px-4 py-2 font-medium">Cant.</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchasesByStatus.map((row) => (
                      <tr key={row.status} className="border-b border-border/30">
                        <td className="px-4 py-2">
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {statusLabel(PO_STATUS_LABELS, row.status)}
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
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="font-semibold">Últimas facturas</h2>
            </div>
            {data.recentInvoices.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Sin facturas.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Número</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Emisión</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                    <th className="px-4 py-2 font-medium text-right">Cobrado</th>
                    <th className="px-4 py-2 font-medium text-right">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border/30">
                      <td className="px-4 py-2">
                        <Link to={`/invoices/${inv.id}`} className="font-medium text-primary hover:underline">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{inv.client?.name ?? '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {inv.issueDate?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={statusBadgeVariant(inv.status)}>
                            {statusLabel(INVOICE_STATUS_LABELS, inv.status)}
                          </Badge>
                          {inv.isOverdue && <Badge variant="danger">Vencida</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">{formatMoney(inv.total)}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(inv.paidAmount ?? 0)}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(inv.balanceDue ?? 0)}</td>
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
