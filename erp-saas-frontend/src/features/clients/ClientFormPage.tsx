import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import {
  FormLayoutEditorProvider,
  FormLayoutEditToggle,
} from '@/contexts/FormLayoutEditorContext';
import { EntityRecordLayout } from '@/components/layout/EntityRecordLayout';
import { EntityRecordHeader } from '@/components/layout/EntityRecordHeader';
import { ClientForm } from '@/features/clients/ClientForm';
import { ClientSummarySection } from '@/features/clients/ClientSummarySection';
import { ClientTimelineSection } from '@/features/clients/ClientTimelineSection';
import { ClientNotesSection } from '@/features/clients/ClientNotesSection';
import { createClient, updateClient, fetchClient } from '@/services/clients.service';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection';
import { ClientPrivacySection } from '@/features/clients/ClientPrivacySection';
import { clientSegmentBadgeVariant, clientSegmentLabel } from '@/lib/clientSegment';

export function ClientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const [extraDirty, setExtraDirty] = useState(false);
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/clients', extraDirty);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClient(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'clients',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createClient>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'clients',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createClient,
      update: updateClient,
      queryClient,
      listQueryKey: ['clients'],
      navigate: () => navigateAfterSave(),
    });
  };

  return (
    <FormLayoutEditorProvider entityId="clients">
      {dialog}
      <EntityRecordLayout
        width="wide"
        header={(
          <EntityRecordHeader
            backLabel="Volver a clientes"
            onBack={leave}
            actions={(
              <>
                {!isNew && client && (
                  <>
                    <Badge variant={clientSegmentBadgeVariant(client.segment)}>
                      {clientSegmentLabel(client.segment)}
                    </Badge>
                    <Button variant="secondary" onClick={() => navigate(`/quotes/new?clientId=${id}`)}>
                      <FileText className="h-4 w-4" />
                      Crear presupuesto
                    </Button>
                  </>
                )}
                <FormLayoutEditToggle />
              </>
            )}
          />
        )}
        summary={!isNew && id ? <ClientSummarySection clientId={id} /> : undefined}
        aside={!isNew && id ? (
          <>
            <ClientTimelineSection clientId={id} />
            <ClientNotesSection clientId={id} onDirtyChange={setExtraDirty} />
            <AttachmentsSection entityType="client" entityId={id} />
            {client && (
              <ClientPrivacySection
                clientId={id}
                clientName={client.name}
                anonymizedAt={client.anonymizedAt}
              />
            )}
          </>
        ) : undefined}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nuevo cliente' : `Ficha: ${client?.name ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <ClientForm
              key={`${client?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              client={client}
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
