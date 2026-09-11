import { z } from 'zod';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ConfigurableFormGrid } from '@/components/forms/ConfigurableFormGrid';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useConfigurableForm } from '@/hooks/useConfigurableForm';
import { useReportFormDirty } from '@/hooks/useReportFormDirty';
import type { FormDirtyProps } from '@/types/form.types';
import type { Supplier, SupplierPayload } from '@/types/supplier.types';

const baseSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

interface SupplierFormProps extends FormDirtyProps {
  supplier?: Supplier;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: SupplierPayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function SupplierForm({ supplier, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    activeConfig,
    isLoading,
    editMode,
    splitSubmitData,
  } = useConfigurableForm({
    entityId: 'suppliers',
    baseSchema,
    defaultValues: {
      name: supplier?.name ?? '',
      email: supplier?.email ?? '',
      phone: supplier?.phone ?? '',
      taxId: supplier?.taxId ?? '',
      address: supplier?.address ?? '',
      city: supplier?.city ?? '',
      postalCode: supplier?.postalCode ?? '',
      country: supplier?.country ?? 'ES',
      notes: supplier?.notes ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange);

  const submit = async (data: Record<string, unknown>) => {
    const { rest, customFields } = splitSubmitData(data);
    const payload = rest as z.infer<typeof baseSchema>;
    await onSubmit({ ...payload, email: payload.email || undefined }, customFields);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader /></div>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="suppliers"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {supplier ? 'Guardar' : 'Crear proveedor'}
        </Button>
      </div>
    </form>
  );
}
