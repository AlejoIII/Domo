import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Copy, Download, Mail, Printer, Undo2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { InvoiceForm } from '@/features/invoices/InvoiceForm';
import {
  createInvoice,
  updateInvoice,
  fetchInvoice,
  duplicateInvoice,
  sendInvoiceEmail,
  cancelInvoice,
  downloadInvoicePdf,
} from '@/services/invoices.service';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection';
import { InvoicePaymentsSection } from '@/features/invoices/InvoicePaymentsSection';
import { InvoiceCreditNotesSection } from '@/features/invoices/InvoiceCreditNotesSection';

export function InvoiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const [extraDirty, setExtraDirty] = useState(false);
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/invoices', extraDirty);

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoice(id!),
    enabled: !isNew && !!id,
    retry: (failureCount, err) => {
      if (isAxiosError(err) && err.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'invoices',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createInvoice>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'invoices',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createInvoice,
      update: updateInvoice,
      queryClient,
      listQueryKey: ['invoices'],
      navigate: () => navigateAfterSave(),
    });
  };

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateInvoice(id!),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/invoices/${copy.id}`);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (to?: string) => sendInvoiceEmail(id!, to),
    onSuccess: (res) => {
      alert(`Factura enviada a ${res.to}`);
    },
    onError: (err: Error) => {
      alert(err.message ?? 'No se pudo enviar el email');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['invoice', id], updated);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const pdfMutation = useMutation({
    mutationFn: () => downloadInvoicePdf(id!, invoice!.number),
    onError: () => {
      alert('No se pudo generar el PDF');
    },
  });

  const isCreditNote = invoice?.documentType === 'credit_note';

  const canCancel =
    !isNew
    && invoice
    && !isCreditNote
    && invoice.status === 'issued'
    && (invoice.creditNotes?.length ?? 0) === 0
    && (invoice.payments?.length ?? 0) === 0
    && (invoice.paidAmount ?? 0) === 0;

  return (
    <FormLayoutEditorProvider entityId="invoices">
      {dialog}
      <EntityRecordLayout
        width="full"
        header={(
          <EntityRecordHeader
            backLabel="Volver a facturas"
            onBack={leave}
            actions={(
              <>
                <FormLayoutEditToggle />
                {!isNew && invoice && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/invoices/${id}/print`)}>
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button
                      variant="secondary"
                      loading={pdfMutation.isPending}
                      onClick={() => pdfMutation.mutate()}
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="secondary"
                      loading={sendEmailMutation.isPending}
                      onClick={() => {
                        const input = prompt('Email del destinatario (vacío = email del cliente):');
                        if (input === null) return;
                        sendEmailMutation.mutate(input.trim() || undefined);
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Enviar
                    </Button>
                    {!isCreditNote && (
                      <Button
                        variant="secondary"
                        loading={duplicateMutation.isPending}
                        onClick={() => {
                          if (!confirm('¿Duplicar esta factura como borrador?')) return;
                          duplicateMutation.mutate();
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Duplicar
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="secondary"
                        loading={cancelMutation.isPending}
                        onClick={() => {
                          if (
                            !confirm(
                              '¿Anular esta factura? Se revertirá el asiento contable y el pedido vinculado volverá a confirmado.',
                            )
                          ) {
                            return;
                          }
                          cancelMutation.mutate();
                        }}
                      >
                        <Undo2 className="h-4 w-4" />
                        Anular factura
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          />
        )}
        aside={!isNew && id && invoice ? (
          <>
            {!isCreditNote && (
              <InvoicePaymentsSection invoice={invoice} onDirtyChange={setExtraDirty} />
            )}
            <InvoiceCreditNotesSection invoice={invoice} />
            <AttachmentsSection entityType="invoice" entityId={id} />
          </>
        ) : undefined}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew
              ? 'Nueva factura'
              : isCreditNote
                ? `Rectificativa: ${invoice?.number ?? '…'}`
                : `Editar: ${invoice?.number ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : isError && isAxiosError(error) && error.response?.status === 404 ? (
            <div className="space-y-4 text-center">
              <p className="text-red-600">Factura no encontrada.</p>
              <Button onClick={() => navigate('/invoices')}>Volver al listado</Button>
            </div>
          ) : (
            <InvoiceForm
              key={`${invoice?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              invoice={invoice}
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
