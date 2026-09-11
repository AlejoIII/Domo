import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { ProductForm } from '@/features/products/ProductForm';
import { StockMovementsList } from '@/features/inventory/StockMovementsList';
import { createProduct, updateProduct, fetchProduct } from '@/services/products.service';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { fetchProductStock } from '@/services/inventory.service';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection';

export function ProductFormPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/products');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'products',
    !isNew ? id : undefined,
  );

  const { data: stockBreakdown } = useQuery({
    queryKey: ['product-stock', id],
    queryFn: () => fetchProductStock(id!),
    enabled: !isNew && !!id,
  });

  const handleSubmit = async (
    payload: Parameters<typeof createProduct>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'products',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createProduct,
      update: updateProduct,
      queryClient,
      listQueryKey: ['products'],
      navigate: () => navigateAfterSave(),
    });
  };

  return (
    <FormLayoutEditorProvider entityId="products">
      {dialog}
      <EntityRecordLayout
        width="wide"
        header={(
          <EntityRecordHeader
            backLabel="Volver a productos"
            onBack={leave}
            actions={<FormLayoutEditToggle />}
          />
        )}
        aside={!isNew && id ? (
          <>
            {stockBreakdown && (
              <Card className="space-y-3 p-5">
                <div>
                  <h2 className="text-lg font-semibold">Stock por almacén</h2>
                  <p className="text-sm text-muted-foreground">
                    Total: <strong>{stockBreakdown.total}</strong> unidades
                  </p>
                </div>
                {stockBreakdown.warehouses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin stock en almacenes.</p>
                ) : (
                  <ul className="divide-y divide-border/60 rounded-lg border border-border/60 text-sm">
                    {stockBreakdown.warehouses.map((row) => (
                      <li key={row.warehouseId} className="flex justify-between px-3 py-2">
                        <span>{row.warehouse.code} · {row.warehouse.name}</span>
                        <span className="font-medium">{row.quantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
            <AttachmentsSection entityType="product" entityId={id} />
          </>
        ) : undefined}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nuevo producto' : `Editar: ${product?.name ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <ProductForm
              key={`${product?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              product={product}
              customFieldValues={customFieldValues}
              embedded
              onDirtyChange={setFormDirty}
              onCancel={leave}
              onSubmit={handleSubmit}
            />
          )}
        </Card>

        {!isNew && id && (
          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Movimientos de stock</h2>
            <StockMovementsList productId={id} />
          </Card>
        )}
      </EntityRecordLayout>
    </FormLayoutEditorProvider>
  );
}
