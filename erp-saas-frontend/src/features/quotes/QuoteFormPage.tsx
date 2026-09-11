import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Copy, Download, Mail, Printer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { QuoteForm } from '@/features/quotes/QuoteForm';
import {
  createQuote, updateQuote, fetchQuote, convertQuoteToOrder, duplicateQuote, sendQuoteEmail,
  downloadQuotePdf,
} from '@/services/quotes.service';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection';

export function QuoteFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId') ?? undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/quotes');

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => fetchQuote(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'quotes',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createQuote>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'quotes',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createQuote,
      update: updateQuote,
      queryClient,
      listQueryKey: ['quotes'],
      navigate: () => navigateAfterSave(),
    });
  };

  const convertMutation = useMutation({
    mutationFn: () => convertQuoteToOrder(id!) as Promise<{ id?: string }>,
    onSuccess: (order: { id?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (order?.id) navigate(`/orders/${order.id}`);
      else navigate('/orders');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateQuote(id!),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      navigate(`/quotes/${copy.id}`);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (to?: string) => sendQuoteEmail(id!, to),
    onSuccess: (res) => {
      alert(`Presupuesto enviado a ${res.to}`);
    },
    onError: (err: Error) => {
      alert(err.message ?? 'No se pudo enviar el email');
    },
  });

  const pdfMutation = useMutation({
    mutationFn: () => downloadQuotePdf(id!, quote!.number),
    onError: () => {
      alert('No se pudo generar el PDF');
    },
  });

  const canConvert =
    !isNew && quote && !['accepted', 'rejected', 'expired'].includes(quote.status);

  return (
    <FormLayoutEditorProvider entityId="quotes">
      {dialog}
      <EntityRecordLayout
        width="full"
        header={(
          <EntityRecordHeader
            backLabel="Volver a presupuestos"
            onBack={leave}
            actions={(
              <>
                <FormLayoutEditToggle />
                {!isNew && quote && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/quotes/${id}/print`)}>
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
                    <Button
                      variant="secondary"
                      loading={duplicateMutation.isPending}
                      onClick={() => {
                        if (!confirm('¿Duplicar este presupuesto como borrador?')) return;
                        duplicateMutation.mutate();
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </Button>
                    {canConvert && (
                      <Button
                        loading={convertMutation.isPending}
                        onClick={() => {
                          if (!confirm('¿Crear pedido a partir de este presupuesto?')) return;
                          convertMutation.mutate();
                        }}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Convertir a pedido
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          />
        )}
        aside={!isNew && id ? <AttachmentsSection entityType="quote" entityId={id} /> : undefined}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nuevo presupuesto' : `Editar: ${quote?.number ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <QuoteForm
              key={`${quote?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}-${initialClientId ?? 'no-client'}`}
              quote={quote}
              initialClientId={initialClientId}
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
