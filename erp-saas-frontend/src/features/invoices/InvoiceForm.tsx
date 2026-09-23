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
import { INVOICE_STATUS_LABELS } from '@/lib/documentStatus';
import { fetchClients } from '@/services/clients.service';
import type { DocLine } from '@/types/document.types';
import type { Invoice, InvoicePayload } from '@/types/invoice.types';

const baseSchema = z.object({
  orderId: z.string().optional(),
  issueDate: z.string().min(1, 'Indica la fecha de emisión'),
  dueDate: z.string().optional(),
  taxRate: z.coerce.number(),
  notes: z.string().optional(),
});

interface InvoiceFormProps extends FormDirtyProps {
  invoice?: Invoice;
  customFieldValues?: Record<string, unknown>;
  onSubmit: (data: InvoicePayload, customFields: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  embedded?: boolean;
}

export function InvoiceForm({ invoice, customFieldValues, onSubmit, onCancel, embedded, onDirtyChange }: InvoiceFormProps) {
  const [clientId, setClientId] = useState(invoice?.clientId ?? '');
  const [status, setStatus] = useState(invoice?.status ?? 'draft');
  const [lines, setLines] = useState<DocLine[]>(
    invoice?.lines?.length
      ? invoice.lines
      : [{ description: '', quantity: 1, unitPrice: 0 }],
  );
  const [error, setError] = useState<string | null>(null);
  const defaultTaxRate = useCompanyStore((s) => s.defaultTaxRate);
  const taxDefault = invoice?.taxRate ?? defaultTaxRate;

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
    entityId: 'invoices',
    baseSchema,
    defaultValues: {
      orderId: invoice?.orderId ?? '',
      issueDate: invoice?.issueDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      dueDate: invoice?.dueDate?.slice(0, 10) ?? '',
      taxRate: taxDefault,
      notes: invoice?.notes ?? '',
    },
    customFieldValues,
  });

  useReportFormDirty(isDirty, onDirtyChange, {
    values: { clientId, status, lines },
    resetKey: invoice?.id ?? 'new',
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
        orderId: fields.orderId || undefined,
        status,
        issueDate: fields.issueDate,
        dueDate: fields.dueDate || undefined,
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
          label="Cliente"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          disabled={editMode}
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
          disabled={editMode}
        >
          {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </SelectField>
      </div>

      <FormRequiredLegend />
      <ConfigurableFormGrid
        entityId="invoices"
        config={activeConfig}
        register={register as never}
        errors={errors as never}
      />

      <DocumentLinesEditor
        lines={lines}
        onChange={setLines}
        enableLineTaxRates
        defaultTaxRate={Number(taxRate) || taxDefault}
      />

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatMoney(totals.subtotal)}</span>
        </div>
        {(totals.taxBreakdown?.length ? totals.taxBreakdown : [
          { taxRate: Number(taxRate) || 0, taxAmount: totals.taxAmount },
        ]).map((row) => (
          <div key={row.taxRate} className="flex justify-between">
            <span className="text-muted-foreground">IVA ({row.taxRate}%)</span>
            <span>{formatMoney(row.taxAmount)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(totals.total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className={cn('flex justify-end gap-2 pt-2', embedded && 'border-t border-border/60')}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={editMode}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting} disabled={editMode}>
          {invoice ? 'Guardar' : 'Crear factura'}
        </Button>
      </div>
    </form>
  );
}
