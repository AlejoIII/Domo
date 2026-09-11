import { z } from 'zod';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ConfigurableFormGrid } from '@/components/forms/ConfigurableFormGrid';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useConfigurableForm } from '@/hooks/useConfigurableForm';
import { useReportFormDirty } from '@/hooks/useReportFormDirty';
import type { FormDirtyProps } from '@/types/form.types';
import type { Warehouse, WarehousePayload } from '@/types/warehouse.types';

const baseSchema = z.object({
  code: z.string().min(1, 'Requerido'),
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

interface WarehouseFormProps extends FormDirtyProps {
  warehouse?: Warehouse;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: WarehousePayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function WarehouseForm({ warehouse, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: WarehouseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    activeConfig,
    isLoading,
    editMode,
    splitSubmitData,
  } = useConfigurableForm({
    entityId: 'warehouses',
    baseSchema,
    defaultValues: {
      code: warehouse?.code ?? '',
      name: warehouse?.name ?? '',
      address: warehouse?.address ?? '',
      city: warehouse?.city ?? '',
      notes: warehouse?.notes ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange);

  const submit = async (data: Record<string, unknown>) => {
    const { rest, customFields } = splitSubmitData(data);
    await onSubmit(rest as unknown as WarehousePayload, customFields);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader /></div>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="warehouses"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {warehouse ? 'Guardar' : 'Crear almacén'}
        </Button>
      </div>
    </form>
  );
}
