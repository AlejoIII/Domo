import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retryVerifactuRecord } from '@/services/verifactu.service';
import type { Invoice } from '@/types/invoice.types';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  queued: 'En cola',
  sent: 'Enviado',
  accepted: 'Aceptado AEAT',
  accepted_with_errors: 'Aceptado con errores',
  rejected: 'Rechazado',
  skipped: 'Omitido',
  dry_run: 'Dry-run',
};

export function InvoiceVerifactuSection({ invoice }: { invoice: Invoice }) {
  const queryClient = useQueryClient();
  const v = invoice.verifactu;

  const retryMutation = useMutation({
    mutationFn: () => retryVerifactuRecord(v!.recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
    },
  });

  if (!v) {
    return (
      <Card className="border-border/60 p-4">
        <h3 className="text-sm font-semibold">Verifactu</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sin registro Verifactu. Actívalo en Ajustes → Verifactu y vuelve a emitir.
        </p>
      </Card>
    );
  }

  const canRetry = ['pending', 'queued', 'rejected'].includes(v.aeatStatus);

  return (
    <Card className="border-border/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Verifactu</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Estado: <span className="font-medium text-foreground">{STATUS_LABELS[v.aeatStatus] ?? v.aeatStatus}</span>
            {v.invoiceType ? ` · Tipo ${v.invoiceType}` : ''}
            {` · #${v.sequenceNo}`}
          </p>
          {v.aeatCsv && (
            <p className="mt-1 text-xs text-muted-foreground">CSV: {v.aeatCsv}</p>
          )}
          {v.aeatError && (
            <p className="mt-1 text-xs text-red-600">{v.aeatError}</p>
          )}
          <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
            {v.huella}
          </p>
        </div>
        {canRetry && (
          <Button
            variant="secondary"
            loading={retryMutation.isPending}
            onClick={() => retryMutation.mutate()}
          >
            Reenviar
          </Button>
        )}
      </div>
      {v.qrUrl && (
        <a
          href={v.qrUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-xs text-primary underline"
        >
          Abrir URL de validación AEAT
        </a>
      )}
    </Card>
  );
}
