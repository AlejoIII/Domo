import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FileMinus2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createCreditNote } from '@/services/invoices.service';
import type { Invoice } from '@/types/invoice.types';
import { formatMoney, formatDate } from '@/lib/format';
import { usePermissions } from '@/hooks/usePermissions';

interface InvoiceCreditNotesSectionProps {
  invoice: Invoice;
}

export function InvoiceCreditNotesSection({ invoice }: InvoiceCreditNotesSectionProps) {
  const queryClient = useQueryClient();
  const { canWrite } = usePermissions();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const creditedAmount = invoice.creditedAmount ?? 0;
  const creditable = Math.max(0, Math.round((invoice.total - creditedAmount) * 100) / 100);
  const canCreate =
    canWrite('invoices')
    && invoice.documentType !== 'credit_note'
    && !['draft', 'cancelled'].includes(invoice.status)
    && creditable > 0;

  const mutation = useMutation({
    mutationFn: () => {
      const requested = amount ? Number(amount) : creditable;
      // Sin importe y sin rectificaciones previas se copian las líneas originales;
      // en cualquier otro caso se emite una línea única con la base equivalente
      const copyOriginalLines = !amount && creditedAmount === 0;

      return createCreditNote(invoice.id, {
        reason,
        lines: copyOriginalLines
          ? undefined
          : [{
              description: `Rectificación de ${invoice.number}`,
              quantity: 1,
              unitPrice: Math.round((requested / (1 + invoice.taxRate / 100)) * 100) / 100,
            }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setOpen(false);
      setReason('');
      setAmount('');
      setError(null);
    },
    onError: (err) => {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'No se pudo emitir la rectificativa')
          : 'No se pudo emitir la rectificativa',
      );
    },
  });

  const creditNotes = invoice.creditNotes ?? [];

  if (invoice.documentType === 'credit_note') {
    return (
      <Card className="space-y-3 p-6">
        <div>
          <h2 className="text-lg font-semibold">Factura rectificativa</h2>
          <p className="text-sm text-muted-foreground">
            Este documento minora una factura emitida.
          </p>
        </div>
        {invoice.originalInvoice && (
          <p className="text-sm">
            Rectifica a{' '}
            <Link
              to={`/invoices/${invoice.originalInvoice.id}`}
              className="font-medium text-primary hover:underline"
            >
              {invoice.originalInvoice.number}
            </Link>
          </p>
        )}
        {invoice.creditReason && (
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Motivo</p>
            <p className="mt-1 text-sm">{invoice.creditReason}</p>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Rectificativas</h2>
          <p className="text-sm text-muted-foreground">
            Notas de crédito emitidas sobre esta factura
          </p>
        </div>
        {invoice.isFullyCredited && <Badge variant="muted">Rectificada</Badge>}
      </div>

      {creditedAmount > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Rectificado</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(creditedAmount)}</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Pendiente de rectificar</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(creditable)}</p>
          </div>
        </div>
      )}

      {creditNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin rectificativas emitidas.</p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
          {creditNotes.map((note) => (
            <li key={note.id} className="p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={`/invoices/${note.id}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {note.number}
                </Link>
                <span className="font-medium">−{formatMoney(note.total)}</span>
              </div>
              <p className="mt-0.5 text-muted-foreground">{formatDate(note.issueDate)}</p>
              {note.creditReason && (
                <p className="mt-0.5 text-xs text-muted-foreground">{note.creditReason}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <FileMinus2 className="h-4 w-4" />
          Emitir rectificativa
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Emitir factura rectificativa">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (reason.trim().length < 3) {
              setError('Indica el motivo de la rectificación');
              return;
            }
            mutation.mutate();
          }}
        >
          <p className="text-sm text-muted-foreground">
            Se emitirá una rectificativa con serie propia sobre{' '}
            <span className="font-medium text-foreground">{invoice.number}</span>. El asiento
            contable se genera invertido automáticamente.
          </p>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Input
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Devolución de mercancía, error en el importe…"
            required
          />
          <Input
            label={`Importe a rectificar (vacío = total ${formatMoney(creditable)})`}
            type="number"
            min="0.01"
            step="0.01"
            max={creditable}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(creditable)}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Emitir rectificativa
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
