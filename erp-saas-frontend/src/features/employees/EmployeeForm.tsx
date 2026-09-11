import { useState } from 'react';
import { z } from 'zod';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ConfigurableFormGrid } from '@/components/forms/ConfigurableFormGrid';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useConfigurableForm } from '@/hooks/useConfigurableForm';
import { useReportFormDirty } from '@/hooks/useReportFormDirty';
import type { FormDirtyProps } from '@/types/form.types';
import type { Employee, EmployeePayload } from '@/types/employee.types';

const baseSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  hireDate: z.string().optional(),
  notes: z.string().optional(),
});

interface EmployeeFormProps extends FormDirtyProps {
  employee?: Employee;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: EmployeePayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function EmployeeForm({ employee, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: EmployeeFormProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(employee?.imageUrl ?? undefined);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    activeConfig,
    isLoading,
    editMode,
    splitSubmitData,
  } = useConfigurableForm({
    entityId: 'employees',
    baseSchema,
    defaultValues: {
      firstName: employee?.firstName ?? '',
      lastName: employee?.lastName ?? '',
      email: employee?.email ?? '',
      phone: employee?.phone ?? '',
      jobTitle: employee?.jobTitle ?? '',
      department: employee?.department ?? '',
      hireDate: employee?.hireDate?.slice(0, 10) ?? '',
      notes: employee?.notes ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange);

  const submit = async (data: Record<string, unknown>) => {
    const { rest, customFields } = splitSubmitData(data);
    const payload = rest as z.infer<typeof baseSchema>;
    await onSubmit({
      ...payload,
      email: payload.email || undefined,
      hireDate: payload.hireDate || undefined,
      imageUrl,
    }, customFields);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader /></div>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        label="Foto del empleado"
        variant="avatar"
      />
      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="employees"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {employee ? 'Guardar' : 'Crear empleado'}
        </Button>
      </div>
    </form>
  );
}
