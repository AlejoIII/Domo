import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, Trash2, Undo2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { SelectField } from '@/components/forms/SelectField';
import { useTabbedPageGuard } from '@/hooks/useTabbedPageGuard';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { fetchProducts } from '@/services/products.service';
import { fetchWarehouses } from '@/services/warehouses.service';
import {
  cancelManufacturingOrder,
  completeManufacturingOrder,
  createBom,
  createManufacturingOrder,
  deleteBom,
  deleteManufacturingOrder,
  fetchBoms,
  fetchManufacturingOrders,
  revertManufacturingOrder,
} from '@/services/manufacturing.service';
import type { Bom, ManufacturingOrder } from '@/types/manufacturing.types';

const tabs = [
  { id: 'boms', label: 'Listas de materiales' },
  { id: 'orders', label: 'Órdenes de fabricación' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  released: 'Liberada',
  done: 'Completada',
  cancelled: 'Cancelada',
};

function defaultDateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ManufacturingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(() =>
    tabParam && tabs.some((t) => t.id === tabParam) ? tabParam : 'boms',
  );
  const { setTabDirty, switchTab, dialog } = useTabbedPageGuard();

  const selectTab = (next: TabId) => {
    switchTab(next, tab, (t) => {
      setTab(t);
      setSearchParams({ tab: t }, { replace: true });
    });
  };

  return (
    <div className="space-y-6">
      {dialog}
      <div>
        <h1 className="text-2xl font-bold">Fabricación</h1>
        <p className="text-sm text-muted-foreground">
          BOM, órdenes de fabricación e integración con stock
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'boms' && <BomsTab onDirtyChange={setTabDirty} />}
      {tab === 'orders' && <OrdersTab onDirtyChange={setTabDirty} />}
    </div>
  );
}

function BomsTab({ onDirtyChange }: { onDirtyChange?: (d: boolean) => void }) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [comp1Id, setComp1Id] = useState('');
  const [comp1Qty, setComp1Qty] = useState('1');
  const [comp2Id, setComp2Id] = useState('');
  const [comp2Qty, setComp2Qty] = useState('1');
  const { isDirty, markClean } = useDraftDirty(
    { productId, name, comp1Id, comp1Qty, comp2Id, comp2Qty },
    'bom-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data: boms = [], isLoading } = useQuery({
    queryKey: ['manufacturing', 'boms'],
    queryFn: () => fetchBoms(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'manufacturing-bom'],
    queryFn: () => fetchProducts({ limit: 100, page: 1 }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const lines = [
        comp1Id ? { componentProductId: comp1Id, quantity: Number(comp1Qty) || 1 } : null,
        comp2Id ? { componentProductId: comp2Id, quantity: Number(comp2Qty) || 1 } : null,
      ].filter(Boolean) as { componentProductId: string; quantity: number }[];

      return createBom({
        productId,
        name: name.trim() || undefined,
        lines,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      setProductId('');
      setName('');
      setComp1Id('');
      setComp2Id('');
      markClean();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manufacturing'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  const products = productsData?.items ?? [];

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nueva lista de materiales</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            label="Producto terminado"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </SelectField>
          <Input label="Nombre" optionalHint value={name} onChange={(e) => setName(e.target.value)} placeholder="BOM estándar" />
          <SelectField
            label="Componente 1"
            required
            value={comp1Id}
            onChange={(e) => setComp1Id(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </SelectField>
          <Input
            label="Cantidad comp. 1"
            required
            type="number"
            min="0.0001"
            step="0.0001"
            value={comp1Qty}
            onChange={(e) => setComp1Qty(e.target.value)}
            placeholder="2"
          />
          <SelectField
            label="Componente 2"
            optionalHint
            value={comp2Id}
            onChange={(e) => setComp2Id(e.target.value)}
          >
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </SelectField>
          <Input
            label="Cantidad comp. 2"
            optionalHint
            type="number"
            min="0.0001"
            step="0.0001"
            value={comp2Qty}
            onChange={(e) => setComp2Qty(e.target.value)}
            placeholder="1"
          />
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!productId || !comp1Id || createMutation.isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear BOM
        </Button>
      </Card>

      <div className="space-y-3">
        {boms.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">No hay listas de materiales</Card>
        ) : (
          boms.map((bom: Bom) => (
            <Card key={bom.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {bom.product.code} — {bom.product.name}
                  </div>
                  {bom.name && <div className="text-sm text-muted-foreground">{bom.name}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={bom.isActive ? 'default' : 'muted'}>
                    {bom.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <Button
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(bom.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ul className="space-y-1 text-sm">
                {bom.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-4 border-t border-border/40 pt-2 first:border-0 first:pt-0">
                    <span>
                      {line.component.code} — {line.component.name}
                    </span>
                    <span className="text-muted-foreground">
                      {line.quantity} {line.component.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function OrdersTab({ onDirtyChange }: { onDirtyChange?: (d: boolean) => void }) {
  const queryClient = useQueryClient();
  const [bomId, setBomId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [warehouseId, setWarehouseId] = useState('');
  const [plannedDate, setPlannedDate] = useState(defaultDateOffset(7));
  const [notes, setNotes] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    { bomId, quantity, warehouseId, plannedDate, notes },
    'mo-new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['manufacturing', 'orders'],
    queryFn: () => fetchManufacturingOrders(),
  });

  const { data: boms = [] } = useQuery({
    queryKey: ['manufacturing', 'boms'],
    queryFn: () => fetchBoms(),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'manufacturing'],
    queryFn: () => fetchWarehouses({ limit: 100, page: 1 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createManufacturingOrder({
        bomId,
        quantity: Number(quantity) || 1,
        warehouseId: warehouseId || undefined,
        plannedDate: plannedDate || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      setBomId('');
      setQuantity('1');
      setNotes('');
      markClean();
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeManufacturingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelManufacturingOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manufacturing'] }),
  });

  const revertMutation = useMutation({
    mutationFn: revertManufacturingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManufacturingOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['manufacturing'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  const activeBoms = boms.filter((b) => b.isActive);
  const warehouses = warehousesData?.items ?? [];

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Nueva orden de fabricación</h2>
        <FormRequiredLegend />
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            label="BOM"
            required
            value={bomId}
            onChange={(e) => setBomId(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {activeBoms.map((b) => (
              <option key={b.id} value={b.id}>
                {b.product.code} — {b.name ?? b.product.name}
              </option>
            ))}
          </SelectField>
          <Input
            label="Cantidad a fabricar"
            required
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="10"
          />
          <SelectField
            label="Almacén"
            optionalHint
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">Por defecto</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </SelectField>
          <Input label="Fecha planificada" optionalHint type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          <div className="md:col-span-2">
            <Input
              label="Notas"
              optionalHint
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prioridad, turno, observaciones de producción…"
            />
          </div>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!bomId || createMutation.isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear orden
        </Button>
      </Card>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">No hay órdenes de fabricación</Card>
        ) : (
          orders.map((order: ManufacturingOrder) => (
            <Card key={order.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {order.number} — {order.product.code}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.product.name} · {Number(order.quantity)} {order.product.unit}
                    {order.warehouse ? ` · ${order.warehouse.code}` : ''}
                  </div>
                </div>
                <Badge variant={order.status === 'done' ? 'success' : 'muted'}>
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </Badge>
              </div>

              <ul className="space-y-1 text-sm text-muted-foreground">
                {order.bom.lines.map((line) => (
                  <li key={line.id}>
                    {Number(line.quantity) * Number(order.quantity)}× {line.component.code}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {['draft', 'released'].includes(order.status) && (
                  <Button
                    onClick={() => {
                      if (
                        !confirm(
                          '¿Completar esta orden? Se consumirán los componentes y entrará el producto terminado en stock.',
                        )
                      ) {
                        return;
                      }
                      completeMutation.mutate(order.id);
                    }}
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Completar (mover stock)
                  </Button>
                )}
                {order.status === 'done' && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (
                        !confirm(
                          '¿Revertir la producción? Se devolverán los componentes al almacén y se retirará el producto terminado.',
                        )
                      ) {
                        return;
                      }
                      revertMutation.mutate(order.id);
                    }}
                    disabled={revertMutation.isPending}
                  >
                    <Undo2 className="mr-1 h-4 w-4" />
                    Revertir producción
                  </Button>
                )}
                {order.status !== 'done' && order.status !== 'cancelled' && (
                  <Button
                    variant="secondary"
                    onClick={() => cancelMutation.mutate(order.id)}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Cancelar
                  </Button>
                )}
                {order.status === 'draft' && (
                  <Button
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(order.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
