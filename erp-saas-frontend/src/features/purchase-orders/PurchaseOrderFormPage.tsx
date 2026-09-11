import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Printer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { PurchaseOrderForm } from '@/features/purchase-orders/PurchaseOrderForm';
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  fetchPurchaseOrder,
  duplicatePurchaseOrder,
} from '@/services/purchase-orders.service';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection';

export function PurchaseOrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/purchase-orders');

  const { data: purchaseOrder, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => fetchPurchaseOrder(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'purchaseOrders',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createPurchaseOrder>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'purchaseOrders',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createPurchaseOrder,
      update: updatePurchaseOrder,
      queryClient,
      listQueryKey: ['purchase-orders'],
      navigate: () => navigateAfterSave(),
    });
  };

  const duplicateMutation = useMutation({
    mutationFn: () => duplicatePurchaseOrder(id!),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      navigate(`/purchase-orders/${copy.id}`);
    },
  });

  return (
    <FormLayoutEditorProvider entityId="purchaseOrders">
      {dialog}
      <EntityRecordLayout
        width="full"
        header={(
          <EntityRecordHeader
            backLabel="Volver a órdenes de compra"
            onBack={leave}
            actions={(
              <>
                <FormLayoutEditToggle />
                {!isNew && purchaseOrder && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/purchase-orders/${id}/print`)}>
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button
                      variant="secondary"
                      loading={duplicateMutation.isPending}
                      onClick={() => {
                        if (!confirm('¿Duplicar esta orden de compra como borrador?')) return;
                        duplicateMutation.mutate();
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </Button>
                  </>
                )}
              </>
            )}
          />
        )}
        aside={!isNew && id ? <AttachmentsSection entityType="purchase_order" entityId={id} /> : undefined}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nueva orden de compra' : `Editar: ${purchaseOrder?.number ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <PurchaseOrderForm
              key={`${purchaseOrder?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              purchaseOrder={purchaseOrder}
              customFieldValues={customFieldValues}
              embedded
              onDirtyChange={setFormDirty}
              onCancel={leave}
              onSubmit={handleSubmit}
            />
          )}
        </Card>
      </EntityRecordLayout>
    </FormLayoutEditorProvider>
  );
}
