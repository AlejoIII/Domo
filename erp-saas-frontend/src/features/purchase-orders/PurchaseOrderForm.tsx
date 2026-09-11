import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ConfigurableFormGrid } from '@/components/forms/ConfigurableFormGrid';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { SelectField } from '@/components/forms/SelectField';
import { useConfigurableForm } from '@/hooks/useConfigurableForm';
import { useReportFormDirty } from '@/hooks/useReportFormDirty';
import type { FormDirtyProps } from '@/types/form.types';
import { DocumentLinesEditor } from '@/features/documents/DocumentLinesEditor';
import { calcDocTotals, toLinePayloads } from '@/lib/document-lines';
import { formatMoney } from '@/lib/format';
import { useCompanyStore } from '@/store/company.store';
import { PO_STATUS_LABELS } from '@/lib/documentStatus';
import { fetchSuppliers } from '@/services/suppliers.service';
import type { DocLine } from '@/types/document.types';
import type { PurchaseOrder, PurchaseOrderPayload } from '@/types/purchase-order.types';

const baseSchema = z.object({
  expectedDate: z.string().optional(),
  taxRate: z.coerce.number(),
  notes: z.string().optional(),
});

interface PurchaseOrderFormProps extends FormDirtyProps {
  purchaseOrder?: PurchaseOrder;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: PurchaseOrderPayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function PurchaseOrderForm({
  purchaseOrder,
  customFieldValues,
  onSubmit,
  onCancel,
  embedded,
  onDirtyChange,
}: PurchaseOrderFormProps) {
  const [supplierId, setSupplierId] = useState(purchaseOrder?.supplierId ?? '');
  const [status, setStatus] = useState(purchaseOrder?.status ?? 'draft');
  const [lines, setLines] = useState<DocLine[]>(
    purchaseOrder?.lines?.length
      ? purchaseOrder.lines
      : [{ description: '', quantity: 1, unitPrice: 0 }],
  );
  const [error, setError] = useState<string | null>(null);
  const defaultTaxRate = useCompanyStore((s) => s.defaultTaxRate);
  const taxDefault = purchaseOrder?.taxRate ?? defaultTaxRate;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    activeConfig,
    isLoading: layoutLoading,
    editMode,
    splitSubmitData,
  } = useConfigurableForm({
    entityId: 'purchaseOrders',
    baseSchema,
    defaultValues: {
      expectedDate: purchaseOrder?.expectedDate?.slice(0, 10) ?? '',
      taxRate: taxDefault,
      notes: purchaseOrder?.notes ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange, {
    values: { supplierId, status, lines },
    resetKey: purchaseOrder?.id ?? 'new',
  });

  const taxRate = useWatch({ control, name: 'taxRate', defaultValue: taxDefault });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', 'select'],
    queryFn: () => fetchSuppliers({ page: 1, limit: 100 }),
  });

  const totals = calcDocTotals(lines, Number(taxRate) || 0);
  const suppliers = suppliersData?.items ?? [];

  const submit = async (data: Record<string, unknown>) => {
    setError(null);
    const { rest, customFields } = splitSubmitData(data);
    const fields = rest as z.infer<typeof baseSchema>;
    if (!supplierId) {
      setError('Selecciona un proveedor');
      return;
    }
    if (!lines.length || lines.some((l) => !l.description.trim())) {
      setError('Todas las líneas necesitan descripción');
      return;
    }
    try {
      await onSubmit({
        supplierId,
        status,
        expectedDate: fields.expectedDate || undefined,
        notes: fields.notes || undefined,
        taxRate: Number(fields.taxRate),
        ...totals,
        lines: toLinePayloads(lines),
      }, customFields);
    } catch {
      // parent handles errors
    }
  };

  if (layoutLoading) {
    return <div className="flex justify-center py-8"><Loader /></div>;
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Proveedor"
          required
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          disabled={editMode}
        >
          <option value="">Seleccionar…</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>
        <SelectField
          label="Estado"
          optionalHint
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={editMode}
        >
          {Object.entries(PO_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectField>
      </div>

      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="purchaseOrders"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <DocumentLinesEditor lines={lines} onChange={setLines} />

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatMoney(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">IVA ({Number(taxRate)}%)</span>
          <span>{formatMoney(totals.taxAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(totals.total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {purchaseOrder ? 'Guardar' : 'Crear orden de compra'}
        </Button>
      </div>
    </form>
  );
}
