import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import {
  createInvoicePayment,
  deleteInvoicePayment,
  fetchInvoicePayments,
} from '@/services/invoices.service';
import type { Invoice } from '@/types/invoice.types';
import { PAYMENT_METHOD_LABELS } from '@/types/invoice.types';
import { formatMoney, formatDate } from '@/lib/format';
import { usePermissions } from '@/hooks/usePermissions';

interface InvoicePaymentsSectionProps {
  invoice: Invoice;
  onDirtyChange?: (dirty: boolean) => void;
}

export function InvoicePaymentsSection({ invoice, onDirtyChange }: InvoicePaymentsSectionProps) {
  const queryClient = useQueryClient();
  const { canWrite } = usePermissions();
  const canManage = canWrite('invoices');
  const canRecord = canManage && !['draft', 'cancelled'].includes(invoice.status);

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<'cash' | 'transfer' | 'card' | 'other'>('transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const { isDirty, markClean } = useDraftDirty(
    { amount, paymentDate, method, reference, notes },
    invoice.id,
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const queryKey = ['invoice-payments', invoice.id];

  const { data: payments, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchInvoicePayments(invoice.id),
    initialData: invoice.payments,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createInvoicePayment>[1]) =>
      createInvoicePayment(invoice.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setAmount('');
      setReference('');
      setNotes('');
      markClean();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoicePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const items = payments ?? [];
  const paidAmount = invoice.paidAmount ?? items.reduce((s, p) => s + p.amount, 0);
  const balanceDue = invoice.balanceDue ?? Math.max(0, invoice.total - paidAmount);

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cobros</h2>
          <p className="text-sm text-muted-foreground">Pagos registrados sobre esta factura</p>
        </div>
        {invoice.isOverdue && (
          <Badge variant="danger">Vencida</Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryItem label="Total factura" value={formatMoney(invoice.total)} />
        <SummaryItem label="Cobrado" value={formatMoney(paidAmount)} />
        <SummaryItem label="Pendiente" value={formatMoney(balanceDue)} highlight={balanceDue > 0} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin cobros registrados.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {items.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{formatMoney(payment.amount)}</p>
                <p className="text-muted-foreground">
                  {formatDate(payment.paymentDate)}
                  {' · '}
                  {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                  {payment.reference ? ` · Ref. ${payment.reference}` : ''}
                </p>
                {payment.notes && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{payment.notes}</p>
                )}
              </div>
              {canManage && (
                <button
                  type="button"
                  className="rounded p-2 text-red-600 hover:bg-red-500/10"
                  title="Anular cobro"
                  onClick={() => {
                    if (
                      confirm(
                        '¿Anular este cobro? Se revertirá el asiento contable y el saldo pendiente de la factura se actualizará.',
                      )
                    ) {
                      deleteMutation.mutate(payment.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canRecord && balanceDue > 0 && (
        <form
          className="space-y-3 border-t border-border/60 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = Number(amount);
            if (!parsed || parsed <= 0) return;
            createMutation.mutate({
              amount: parsed,
              paymentDate,
              method,
              reference: reference || undefined,
              notes: notes || undefined,
            });
          }}
        >
          <h3 className="font-medium">Registrar cobro</h3>
          <FormRequiredLegend />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Importe"
              type="number"
              min="0.01"
              step="0.01"
              max={balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(balanceDue)}
              required
            />
            <Input
              label="Fecha"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Método</span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <Input
              label="Referencia"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Nº transferencia o recibo"
            />
          </div>
          <Input
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cobro parcial, anticipo…"
          />
          <Button type="submit" loading={createMutation.isPending}>
            <CreditCard className="h-4 w-4" />
            Registrar cobro
          </Button>
        </form>
      )}
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${highlight ? 'text-amber-600' : ''}`}>{value}</p>
    </div>
  );
}
