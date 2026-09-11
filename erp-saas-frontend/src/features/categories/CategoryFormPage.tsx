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
import { CategoryForm } from '@/features/categories/CategoryForm';
import { createCategory, updateCategory, fetchCategory } from '@/services/categories.service';
import { useEntityCustomFieldValues } from '@/hooks/useEntityCustomFieldValues';
import { useEntityFormPageGuard } from '@/hooks/useEntityFormPageGuard';
import { saveEntityWithCustomFields } from '@/lib/save-entity-with-custom-fields';

export function CategoryFormPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isNew = id === 'new' || !id;
  const { setFormDirty, leave, navigateAfterSave, dialog } = useEntityFormPageGuard('/categories');

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => fetchCategory(id!),
    enabled: !isNew && !!id,
  });

  const { data: customFieldValues, isLoading: customFieldsLoading } = useEntityCustomFieldValues(
    'categories',
    !isNew ? id : undefined,
  );

  const handleSubmit = async (
    payload: Parameters<typeof createCategory>[0],
    customFields: Record<string, unknown>,
  ) => {
    await saveEntityWithCustomFields({
      entityId: 'categories',
      isNew,
      recordId: id,
      payload,
      customFields,
      create: createCategory,
      update: updateCategory,
      queryClient,
      listQueryKey: ['categories'],
      navigate: () => navigateAfterSave(),
    });
  };

  return (
    <FormLayoutEditorProvider entityId="categories">
      {dialog}
      <EntityRecordLayout
        width="comfortable"
        header={(
          <EntityRecordHeader
            backLabel="Volver a categorías"
            onBack={leave}
            actions={<FormLayoutEditToggle />}
          />
        )}
      >
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold">
            {isNew ? 'Nueva categoría' : `Editar: ${category?.name ?? '…'}`}
          </h1>

          {isLoading || customFieldsLoading ? (
            <div className="flex justify-center py-12"><Loader /></div>
          ) : (
            <CategoryForm
              key={`${category?.id ?? 'new'}-${customFieldValues ? 'cf' : 'new-cf'}`}
              category={category}
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
