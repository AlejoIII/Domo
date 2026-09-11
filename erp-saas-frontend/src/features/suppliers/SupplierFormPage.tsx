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
import { SupplierForm } from '@/features/suppliers/SupplierForm';
import { createSupplier, updateSupplier, fetchSupplier } from '@/services/suppliers.service';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';
import { AttachmentsSection } from '@/features/attachments/AttachmentsSection';

export function SupplierFormPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/suppliers');

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => fetchSupplier(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'suppliers',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createSupplier>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'suppliers',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createSupplier,
      update: updateSupplier,
      queryClient,
      listQueryKey: ['suppliers'],
      navigate: () => navigateAfterSave(),
    });
  };

  return (
    <FormLayoutEditorProvider entityId="suppliers">
      {dialog}
      <EntityRecordLayout
        width="wide"
        header={(
          <EntityRecordHeader
            backLabel="Volver a proveedores"
            onBack={leave}
            actions={<FormLayoutEditToggle />}
          />
        )}
        aside={!isNew && id ? <AttachmentsSection entityType="supplier" entityId={id} /> : undefined}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nuevo proveedor' : `Editar: ${supplier?.name ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <SupplierForm
              key={`${supplier?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              supplier={supplier}
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
