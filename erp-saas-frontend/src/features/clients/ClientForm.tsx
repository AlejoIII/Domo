import { z } from 'zod';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ConfigurableFormGrid } from '@/components/forms/ConfigurableFormGrid';
import { FormLabel, FormRequiredLegend } from '@/components/forms/FormLabel';
import { useConfigurableForm } from '@/hooks/useConfigurableForm';
import { useReportFormDirty } from '@/hooks/useReportFormDirty';
import type { FormDirtyProps } from '@/types/form.types';
import type { Client, ClientPayload } from '@/types/client.types';

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
  segment: z.enum(['lead', 'active', 'inactive']).optional(),
});

interface ClientFormProps extends FormDirtyProps {
  client?: Client;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: ClientPayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function ClientForm({ client, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    activeConfig,
    isLoading,
    editMode,
    splitSubmitData,
  } = useConfigurableForm({
    entityId: 'clients',
    baseSchema,
    defaultValues: {
      name: client?.name ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      taxId: client?.taxId ?? '',
      address: client?.address ?? '',
      city: client?.city ?? '',
      postalCode: client?.postalCode ?? '',
      country: client?.country ?? 'ES',
      notes: client?.notes ?? '',
      segment: client?.segment ?? 'active',
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
      <div className="space-y-1">
        <FormLabel optionalHint>Segmento CRM</FormLabel>
        <select
          className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm disabled:opacity-50"
          disabled={editMode}
          {...register('segment')}
        >
          <option value="lead">Lead</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <ConfigurableFormGrid
        entityId="clients"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {client ? 'Guardar' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}
