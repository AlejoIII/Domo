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
import type { Product, ProductPayload } from '@/types/product.types';

const baseSchema = z.object({
  code: z.string().min(1, 'Requerido'),
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0, 'Mínimo 0'),
  cost: z.coerce.number().min(0).optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  unit: z.string().optional(),
  barcode: z.string().optional(),
});

interface ProductFormProps extends FormDirtyProps {
  product?: Product;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: ProductPayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function ProductForm({ product, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: ProductFormProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(product?.imageUrl ?? undefined);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    activeConfig,
    isLoading,
    editMode,
    splitSubmitData,
  } = useConfigurableForm({
    entityId: 'products',
    baseSchema,
    defaultValues: {
      code: product?.code ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      category: product?.category ?? '',
      price: product?.price ?? 0,
      cost: product?.cost ?? '',
      stock: product?.stock ?? 0,
      minStock: product?.minStock ?? 0,
      unit: product?.unit ?? 'ud',
      barcode: product?.barcode ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange, {
    values: { imageUrl },
    resetKey: product?.id ?? 'new',
  });

  const submit = async (data: Record<string, unknown>) => {
    const { rest, customFields } = splitSubmitData(data);
    const payload = rest as z.infer<typeof baseSchema>;
    await onSubmit({
      ...payload,
      cost: payload.cost === '' || payload.cost == null ? undefined : Number(payload.cost),
      imageUrl,
    }, customFields);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader /></div>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <ImageUpload value={imageUrl} onChange={setImageUrl} label="Imagen del producto" />
      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="products"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {product ? 'Guardar' : 'Crear producto'}
        </Button>
      </div>
    </form>
  );
}
