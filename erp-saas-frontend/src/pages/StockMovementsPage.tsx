import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { ProductSelect } from '@/components/forms/ProductSelect';
import { WarehouseSelect } from '@/components/forms/WarehouseSelect';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import {
  createStockTransfer,
  exportStockMovements,
  fetchStockMovements,
} from '@/services/inventory.service';
import { movementRefLabel, movementTypeLabel } from '@/lib/inventoryLabels';

function defaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export function StockMovementsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [type, setType] = useState('');
  const [referenceType, setReferenceType] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState({
    from: defaultFrom(),
    to: defaultTo(),
    type: '',
    referenceType: '',
    warehouseId: '',
    productId: '',
    search: '',
  });
  const [exporting, setExporting] = useState(false);

  const [fromWh, setFromWh] = useState('');
  const [toWh, setToWh] = useState('');
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [transferNotes, setTransferNotes] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    { fromWh, toWh, transferProductId, transferQty, transferNotes },
    'transfer',
  );
  const { dialog } = useUnsavedChangesGuard(isDirty);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['stock-movements', page, applied],
    queryFn: () =>
      fetchStockMovements({
        page,
        limit: 25,
        from: applied.from || undefined,
        to: applied.to || undefined,
        type: applied.type || undefined,
        referenceType: applied.referenceType || undefined,
        warehouseId: applied.warehouseId || undefined,
        productId: applied.productId || undefined,
        search: applied.search || undefined,
      }),
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      createStockTransfer({
        fromWarehouseId: fromWh,
        toWarehouseId: toWh,
        productId: transferProductId,
        quantity: Number(transferQty),
        notes: transferNotes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFromWh('');
      setToWh('');
      setTransferProductId('');
      setTransferNotes('');
      setTransferQty(1);
      markClean();
    },
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {dialog}
      <div>
        <h1 className="text-2xl font-bold">Movimientos de stock</h1>
        <p className="text-sm text-muted-foreground">Ledger de entradas, salidas, ajustes y transferencias</p>
      </div>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Transferencia entre almacenes</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          <WarehouseSelect label="Origen *" value={fromWh} onChange={setFromWh} excludeId={toWh} />
          <WarehouseSelect label="Destino *" value={toWh} onChange={setToWh} excludeId={fromWh} />
          <ProductSelect label="Producto *" value={transferProductId} onChange={setTransferProductId} />
          <Input
            label="Cantidad"
            type="number"
            min={1}
            value={transferQty}
            onChange={(e) => setTransferQty(Number(e.target.value))}
            placeholder="0"
          />
          <div className="sm:col-span-2">
            <Input
              label="Notas (opcional)"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Reposición para el almacén de Madrid"
            />
          </div>
        </div>
        <Button
          loading={transferMutation.isPending}
          disabled={!fromWh || !toWh || !transferProductId || transferQty < 1}
          onClick={() => transferMutation.mutate()}
        >
          Transferir stock
        </Button>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo</label>
            <select
              className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="in">Entrada</option>
              <option value="out">Salida</option>
              <option value="adjustment">Ajuste</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Referencia</label>
            <select
              className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="sales_order">Pedido venta</option>
              <option value="purchase_order">Orden compra</option>
              <option value="manual">Manual</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <WarehouseSelect label="Almacén" value={warehouseId} onChange={setWarehouseId} />
          <ProductSelect value={productId} onChange={setProductId} />
          <Input label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Producto, almacén, notas…" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setPage(1);
              setApplied({ from, to, type, referenceType, warehouseId, productId, search });
            }}
          >
            Aplicar filtros
          </Button>
          <Button
            variant="secondary"
            loading={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await exportStockMovements({
                  from: applied.from || undefined,
                  to: applied.to || undefined,
                  type: applied.type || undefined,
                  referenceType: applied.referenceType || undefined,
                  warehouseId: applied.warehouseId || undefined,
                  productId: applied.productId || undefined,
                  search: applied.search || undefined,
                });
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader /></div>
      ) : isError ? (
        <Card className="p-6"><p className="text-sm text-red-600">No se pudieron cargar los movimientos.</p></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Almacén</th>
                  <th className="px-4 py-3 font-medium text-right">Cant.</th>
                  <th className="px-4 py-3 font-medium">Referencia</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No hay movimientos con estos filtros.
                    </td>
                  </tr>
                ) : (
                  items.map((m) => (
                    <tr key={m.id} className="border-b border-border/40">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-3">{movementTypeLabel(m.type)}</td>
                      <td className="px-4 py-3">{m.product?.code ?? '—'} · {m.product?.name ?? '—'}</td>
                      <td className="px-4 py-3">{m.warehouse?.code ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${m.quantity < 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-xs">{movementRefLabel(m.referenceType)}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-xs text-muted-foreground">{m.notes ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Página {meta.page} de {meta.totalPages} ({meta.total} movimientos)
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
