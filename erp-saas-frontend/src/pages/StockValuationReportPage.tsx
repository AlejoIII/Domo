import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { WarehouseSelect } from '@/components/forms/WarehouseSelect';
import { exportStockValuation, fetchStockValuation } from '@/services/inventory.service';
import { formatMoney } from '@/lib/format';

export function StockValuationReportPage() {
  const [warehouseId, setWarehouseId] = useState('');
  const [appliedWarehouseId, setAppliedWarehouseId] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'stock-valuation', appliedWarehouseId],
    queryFn: () => fetchStockValuation(appliedWarehouseId ? { warehouseId: appliedWarehouseId } : undefined),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Valoración de stock</h1>
        <p className="text-sm text-muted-foreground">Cantidad × coste unitario por producto y almacén</p>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="min-w-[220px] flex-1">
          <WarehouseSelect label="Almacén (opcional)" value={warehouseId} onChange={setWarehouseId} />
        </div>
        <Button onClick={() => setAppliedWarehouseId(warehouseId)}>Aplicar</Button>
        <Button
          variant="secondary"
          loading={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await exportStockValuation(
                appliedWarehouseId ? { warehouseId: appliedWarehouseId } : undefined,
              );
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : isError || !data ? (
        <Card className="p-6"><p className="text-sm text-red-600">No se pudo cargar la valoración.</p></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Valor total" value={formatMoney(data.summary.totalValue)} />
            <Kpi label="Unidades" value={String(data.summary.totalUnits)} />
            <Kpi label="Líneas con stock" value={String(data.summary.lineCount)} />
          </div>

          {data.byWarehouse.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-border/60 px-4 py-3">
                <h2 className="font-semibold">Por almacén</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Almacén</th>
                      <th className="px-4 py-3 font-medium text-right">Unidades</th>
                      <th className="px-4 py-3 font-medium text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byWarehouse.map((row) => (
                      <tr key={row.warehouseId} className="border-b border-border/40">
                        <td className="px-4 py-3">{row.warehouse.code} · {row.warehouse.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="font-semibold">Detalle por producto</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Almacén</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium text-right">Cant.</th>
                    <th className="px-4 py-3 font-medium text-right">Coste ud.</th>
                    <th className="px-4 py-3 font-medium text-right">Valoración</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No hay stock valorizable (revisa costes en productos).
                      </td>
                    </tr>
                  ) : (
                    data.lines.map((line) => (
                      <tr key={`${line.warehouseId}-${line.productId}`} className="border-b border-border/40">
                        <td className="px-4 py-3">{line.warehouse.code}</td>
                        <td className="px-4 py-3">{line.product.code} · {line.product.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{line.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(line.unitCost)}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(line.valuation)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}
