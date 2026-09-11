import { z } from 'zod';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ConfigurableFormGrid } from '@/components/forms/ConfigurableFormGrid';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useConfigurableForm } from '@/hooks/useConfigurableForm';
import { useReportFormDirty } from '@/hooks/useReportFormDirty';
import type { FormDirtyProps } from '@/types/form.types';
import type { Category, CategoryPayload } from '@/types/category.types';

const baseSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
});

interface CategoryFormProps extends FormDirtyProps {
  category?: Category;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: CategoryPayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function CategoryForm({ category, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    activeConfig,
    isLoading,
    editMode,
    splitSubmitData,
  } = useConfigurableForm({
    entityId: 'categories',
    baseSchema,
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange);

  const submit = async (data: Record<string, unknown>) => {
    const { rest, customFields } = splitSubmitData(data);
    await onSubmit(rest as unknown as CategoryPayload, customFields);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader /></div>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="categories"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {category ? 'Guardar' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  );
}
