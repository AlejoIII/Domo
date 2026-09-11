import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductSelect } from '@/components/forms/ProductSelect';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { WarehouseForm } from '@/features/warehouses/WarehouseForm';
import { StockMovementsList } from '@/features/inventory/StockMovementsList';
import {
  createWarehouse,
  updateWarehouse,
  fetchWarehouse,
  adjustWarehouseStock,
} from '@/services/warehouses.service';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';

export function WarehouseFormPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const { isDirty: stockAdjustDirty, markClean: markStockAdjustClean } = useDraftDirty(
    { productId, quantity, notes },
    id ?? 'stock-adjust',
  );
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/warehouses', stockAdjustDirty);

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => fetchWarehouse(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'warehouses',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createWarehouse>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'warehouses',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createWarehouse,
      update: updateWarehouse,
      queryClient,
      listQueryKey: ['warehouses'],
      navigate: () => navigateAfterSave(),
    });
  };

  const stockMutation = useMutation({
    mutationFn: () =>
      adjustWarehouseStock(id!, {
        productId,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      setProductId('');
      setQuantity(0);
      setNotes('');
      markStockAdjustClean();
    },
  });

  const stocks = warehouse?.stocks ?? [];

  const stockAdjustAside = !isNew && warehouse ? (
    <Card className="space-y-3 p-5">
      <h2 className="text-lg font-semibold">Ajustar stock</h2>
      <p className="text-xs text-muted-foreground">Cantidad objetivo total en este almacén.</p>
      <ProductSelect value={productId} onChange={setProductId} />
      <Input
        label="Cantidad total"
        type="number"
        min={0}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        placeholder="120"
      />
      <Input
        label="Motivo (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Inventario físico, rotura, corrección…"
      />
      <Button
        type="button"
        className="w-full"
        loading={stockMutation.isPending}
        disabled={!productId}
        onClick={() => stockMutation.mutate()}
      >
        Guardar ajuste
      </Button>
      {stockMutation.isError && (
        <p className="text-xs text-red-600">No se pudo ajustar el stock.</p>
      )}
    </Card>
  ) : undefined;

  return (
    <FormLayoutEditorProvider entityId="warehouses">
      {dialog}
      <EntityRecordLayout
        width="wide"
        header={(
          <EntityRecordHeader
            backLabel="Volver a almacenes"
            onBack={leave}
            actions={<FormLayoutEditToggle />}
          />
        )}
        aside={stockAdjustAside}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nuevo almacén' : `Editar: ${warehouse?.name ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <WarehouseForm
              key={`${warehouse?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              warehouse={warehouse}
              customFieldValues={customFieldValues}
              embedded
              onDirtyChange={setFormDirty}
              onCancel={leave}
              onSubmit={handleSubmit}
            />
          )}
        </Card>

        {!isNew && warehouse && (
          <>
            <Card className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">Stock en almacén</h2>

              {stocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin stock registrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-muted-foreground">
                        <th className="px-2 py-2 font-medium">Código</th>
                        <th className="px-2 py-2 font-medium">Producto</th>
                        <th className="px-2 py-2 font-medium text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks.map((stock) => (
                        <tr key={stock.id ?? stock.productId} className="border-b border-border/40">
                          <td className="px-2 py-2 font-mono text-xs">{stock.product?.code ?? '—'}</td>
                          <td className="px-2 py-2">{stock.product?.name ?? stock.productId}</td>
                          <td className="px-2 py-2 text-right font-medium">{stock.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">Movimientos recientes</h2>
              <StockMovementsList warehouseId={warehouse.id} />
            </Card>
          </>
        )}
      </EntityRecordLayout>
    </FormLayoutEditorProvider>
  );
}
