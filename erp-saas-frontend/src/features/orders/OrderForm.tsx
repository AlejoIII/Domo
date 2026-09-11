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
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '@/lib/documentStatus';
import { fetchClients } from '@/services/clients.service';
import type { DocLine } from '@/types/document.types';
import type { SalesOrder, OrderPayload } from '@/types/order.types';

const baseSchema = z.object({
  orderDate: z.string().min(1, 'Indica la fecha'),
  taxRate: z.coerce.number(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
});

interface OrderFormProps extends FormDirtyProps {
  order?: SalesOrder;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: OrderPayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function OrderForm({ order, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: OrderFormProps) {
  const [clientId, setClientId] = useState(order?.clientId ?? '');
  const [status, setStatus] = useState(order?.status ?? 'draft');
  const [lines, setLines] = useState<DocLine[]>(
    order?.lines?.length
      ? order.lines
      : [{ description: '', quantity: 1, unitPrice: 0 }],
  );
  const [error, setError] = useState<string | null>(null);
  const defaultTaxRate = useCompanyStore((s) => s.defaultTaxRate);
  const taxDefault = order?.taxRate ?? defaultTaxRate;

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
    entityId: 'orders',
    baseSchema,
    defaultValues: {
      orderDate: order?.orderDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      taxRate: taxDefault,
      notes: order?.notes ?? '',
      trackingNumber: order?.trackingNumber ?? '',
      deliveryAddress: order?.deliveryAddress ?? '',
      deliveryNotes: order?.deliveryNotes ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange, {
    values: { clientId, status, lines },
    resetKey: order?.id ?? 'new',
  });

  const taxRate = useWatch({ control, name: 'taxRate', defaultValue: taxDefault });

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'select'],
    queryFn: () => fetchClients({ page: 1, limit: 100 }),
  });

  const totals = calcDocTotals(lines, Number(taxRate) || 0);
  const clients = clientsData?.items ?? [];

  const submit = async (data: Record<string, unknown>) => {
    setError(null);
    const { rest, customFields } = splitSubmitData(data);
    const fields = rest as z.infer<typeof baseSchema>;
    if (!clientId) {
      setError('Selecciona un cliente');
      return;
    }
    if (!lines.length || lines.some((l) => !l.description.trim())) {
      setError('Todas las líneas necesitan descripción');
      return;
    }
    try {
      await onSubmit({
        clientId,
        status,
        orderDate: fields.orderDate,
        notes: fields.notes || undefined,
        trackingNumber: fields.trackingNumber || undefined,
        deliveryAddress: fields.deliveryAddress || undefined,
        deliveryNotes: fields.deliveryNotes || undefined,
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
          label="Cliente"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <SelectField
          label="Estado"
          optionalHint
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectField>
      </div>

      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="orders"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <div className="rounded-lg border border-border/60 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Flujo de entrega</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {ORDER_STATUS_FLOW.map((step, i) => {
              const currentIndex = ORDER_STATUS_FLOW.indexOf(
                status as (typeof ORDER_STATUS_FLOW)[number],
              );
              const active = status === step;
              const passed = currentIndex >= 0 && i <= currentIndex;
              return (
                <div
                  key={step}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    active && 'bg-primary text-primary-foreground',
                    !active && passed && 'bg-primary/15 text-primary',
                    !active && !passed && 'bg-muted text-muted-foreground',
                  )}
                >
                  {ORDER_STATUS_LABELS[step]}
                </div>
              );
            })}
          </div>
          {order?.shippedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Enviado: {new Date(order.shippedAt).toLocaleString('es-ES')}
            </p>
          )}
          {order?.deliveredAt && (
            <p className="text-xs text-muted-foreground">
              Entregado: {new Date(order.deliveredAt).toLocaleString('es-ES')}
            </p>
          )}
        </div>
      </div>

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
          {order ? 'Guardar' : 'Crear pedido'}
        </Button>
      </div>
    </form>
  );
}
