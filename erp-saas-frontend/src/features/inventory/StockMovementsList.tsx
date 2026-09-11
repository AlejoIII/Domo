import { useQuery } from '@tanstack/react-query';
import { fetchStockMovements } from '@/services/inventory.service';
import { movementTypeLabel } from '@/lib/inventoryLabels';

export function StockMovementsList({
  warehouseId,
  productId,
}: {
  warehouseId?: string;
  productId?: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stock-movements', warehouseId, productId],
    queryFn: () =>
      fetchStockMovements({
        page: 1,
        limit: 15,
        warehouseId,
        productId,
      }),
    enabled: !!(warehouseId || productId),
  });

  const items = data?.items ?? [];

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando movimientos…</p>;
  if (isError) return <p className="text-sm text-red-600">No se pudieron cargar los movimientos.</p>;
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-muted-foreground">
            <th className="px-2 py-2 font-medium">Fecha</th>
            <th className="px-2 py-2 font-medium">Tipo</th>
            {!productId && <th className="px-2 py-2 font-medium">Producto</th>}
            {!warehouseId && <th className="px-2 py-2 font-medium">Almacén</th>}
            <th className="px-2 py-2 font-medium text-right">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id} className="border-b border-border/40">
              <td className="px-2 py-2 text-xs text-muted-foreground">
                {new Date(m.createdAt).toLocaleString('es-ES')}
              </td>
              <td className="px-2 py-2">{movementTypeLabel(m.type)}</td>
              {!productId && (
                <td className="px-2 py-2">
                  {m.product?.code ?? '—'} · {m.product?.name ?? '—'}
                </td>
              )}
              {!warehouseId && (
                <td className="px-2 py-2">{m.warehouse?.code ?? '—'}</td>
              )}
              <td className={`px-2 py-2 text-right font-medium ${m.quantity < 0 ? 'text-red-600' : 'text-green-700'}`}>
                {m.quantity > 0 ? '+' : ''}{m.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
