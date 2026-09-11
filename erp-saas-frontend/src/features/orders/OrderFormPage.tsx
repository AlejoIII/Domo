import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, FileText, Package, Printer, Undo2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { OrderForm } from '@/features/orders/OrderForm';
import {
  createOrder, updateOrder, fetchOrder, convertOrderToInvoice, duplicateOrder, markOrderDelivered,
  unconfirmOrder,
} from '@/services/orders.service';
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';

export function OrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/orders');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'orders',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createOrder>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'orders',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createOrder,
      update: updateOrder,
      queryClient,
      listQueryKey: ['orders'],
      navigate: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        navigateAfterSave();
      },
    });
  };

  const convertMutation = useMutation({
    mutationFn: () => convertOrderToInvoice(id!) as Promise<{ id?: string }>,
    onSuccess: (invoice: { id?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (invoice?.id) navigate(`/invoices/${invoice.id}`);
      else navigate('/invoices');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateOrder(id!),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${copy.id}`);
    },
  });

  const deliverMutation = useMutation({
    mutationFn: () => markOrderDelivered(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['order', id], updated);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (window.confirm('Pedido marcado como entregado. ¿Imprimir albarán ahora?')) {
        navigate(`/orders/${id}/delivery-note/print`);
      }
    },
  });

  const unconfirmMutation = useMutation({
    mutationFn: () => unconfirmOrder(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['order', id], updated);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const canInvoice =
    !isNew && order && !['cancelled', 'invoiced'].includes(order.status);

  const canMarkDelivered =
    !isNew && order && ['confirmed', 'shipped'].includes(order.status);

  const canUnconfirm = !isNew && order && order.status === 'confirmed';

  const canPrintDeliveryNote =
    !isNew && order && order.deliveryNoteNumber && ['delivered', 'invoiced'].includes(order.status);

  return (
    <FormLayoutEditorProvider entityId="orders">
      {dialog}
      <EntityRecordLayout
        width="full"
        header={(
          <EntityRecordHeader
            backLabel="Volver a pedidos"
            onBack={leave}
            actions={(
              <>
                <FormLayoutEditToggle />
                {!isNew && order && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/orders/${id}/print`)}>
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    {canMarkDelivered && (
                      <Button
                        loading={deliverMutation.isPending}
                        onClick={() => {
                          if (!confirm('¿Marcar este pedido como entregado? Se generará el número de albarán.')) return;
                          deliverMutation.mutate();
                        }}
                      >
                        <Package className="h-4 w-4" />
                        Marcar entregado
                      </Button>
                    )}
                    {canUnconfirm && (
                      <Button
                        variant="secondary"
                        loading={unconfirmMutation.isPending}
                        onClick={() => {
                          if (
                            !confirm(
                              '¿Deshacer la confirmación? El pedido volverá a borrador y el stock reservado se devolverá al almacén.',
                            )
                          ) {
                            return;
                          }
                          unconfirmMutation.mutate();
                        }}
                      >
                        <Undo2 className="h-4 w-4" />
                        Deshacer confirmación
                      </Button>
                    )}
                    {canPrintDeliveryNote && (
                      <Button variant="secondary" onClick={() => navigate(`/orders/${id}/delivery-note/print`)}>
                        <Package className="h-4 w-4" />
                        Albarán
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      loading={duplicateMutation.isPending}
                      onClick={() => {
                        if (!confirm('¿Duplicar este pedido como borrador?')) return;
                        duplicateMutation.mutate();
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </Button>
                    {canInvoice && (
                      <Button
                        loading={convertMutation.isPending}
                        onClick={() => {
                          if (!confirm('¿Crear factura a partir de este pedido?')) return;
                          convertMutation.mutate();
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        Convertir a factura
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          />
        )}
        aside={!isNew && id ? <AttachmentsSection entityType="order" entityId={id} /> : undefined}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nuevo pedido' : `Editar: ${order?.number ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <OrderForm
              key={`${order?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              order={order}
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
