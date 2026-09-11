import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { fetchQuote } from '@/services/quotes.service';
import { fetchOrder } from '@/services/orders.service';
import { fetchInvoice } from '@/services/invoices.service';
import { fetchPurchaseOrder } from '@/services/purchase-orders.service';
import { fetchCompanySettings } from '@/services/settings.service';
import { fetchBillingPrintBranding } from '@/services/billing.service';
import { formatMoney } from '@/lib/format';
import { useAuthReady } from '@/hooks/useAuthReady';
import { PrintPlanWatermark } from '@/components/print/PrintPlanWatermark';
import { FREE_PDF_WATERMARK } from '@/config/plan-features.config';
import {
  INVOICE_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PO_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  statusLabel,
} from '@/lib/documentStatus';

type DocKind = 'quotes' | 'orders' | 'invoices' | 'purchase-orders' | 'delivery-notes';

interface PrintLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

interface PrintParty {
  name: string;
  email?: string | null;
  taxId?: string | null;
  address?: string | null;
  city?: string | null;
}

export function DocumentPrintPage({ kind }: { kind: DocKind }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authReady = useAuthReady();
  const isDeliveryNote = kind === 'delivery-notes';
  const isPurchaseOrder = kind === 'purchase-orders';

  const listPath = kind === 'quotes'
    ? '/quotes'
    : kind === 'orders' || isDeliveryNote
      ? '/orders'
      : kind === 'purchase-orders'
        ? '/purchase-orders'
        : '/invoices';

  const companyQuery = useQuery({
    queryKey: ['settings', 'company'],
    queryFn: fetchCompanySettings,
    enabled: authReady,
  });

  const brandingQuery = useQuery({
    queryKey: ['billing', 'print-branding'],
    queryFn: fetchBillingPrintBranding,
    enabled: authReady,
    staleTime: 60_000,
  });

  const showPdfWatermark = brandingQuery.data?.pdfWatermark === true;
  const watermarkText = brandingQuery.data?.watermarkText ?? FREE_PDF_WATERMARK;
  const brandingLoading = brandingQuery.isLoading;

  const docQuery = useQuery({
    queryKey: [kind, id, 'print'],
    queryFn: async (): Promise<Record<string, unknown>> => {
      if (kind === 'quotes') return fetchQuote(id!) as unknown as Record<string, unknown>;
      if (kind === 'orders' || isDeliveryNote) return fetchOrder(id!) as unknown as Record<string, unknown>;
      if (kind === 'purchase-orders') return fetchPurchaseOrder(id!) as unknown as Record<string, unknown>;
      return fetchInvoice(id!) as unknown as Record<string, unknown>;
    },
    enabled: authReady && !!id,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response?.status === 404) return false;
      return failureCount < 1;
    },
  });

  const isNotFound = isAxiosError(docQuery.error) && docQuery.error.response?.status === 404;

  useEffect(() => {
    if (!isNotFound || !id) return;
    queryClient.removeQueries({ queryKey: [kind, id] });
    queryClient.removeQueries({ queryKey: [kind, id, 'print'] });
  }, [isNotFound, id, kind, queryClient]);

  useEffect(() => {
    if (!docQuery.data || brandingLoading) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [docQuery.data, brandingLoading]);

  if (docQuery.isLoading || companyQuery.isLoading || brandingLoading) {
    return (
      <div className="flex justify-center py-24"><Loader /></div>
    );
  }

  if (docQuery.isError || !docQuery.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">
          {isNotFound
            ? 'Documento no encontrado. Puede haber sido eliminado o los datos de demo se regeneraron.'
            : 'No se pudo cargar el documento.'}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
          <Button onClick={() => navigate(listPath)}>Ir al listado</Button>
        </div>
      </div>
    );
  }

  const raw = docQuery.data as Record<string, unknown>;
  const lines = (raw.lines as PrintLine[]) ?? [];
  const company = companyQuery.data;

  const client = raw.client as PrintParty | undefined;
  const supplier = raw.supplier as PrintParty | undefined;
  const party = isPurchaseOrder ? supplier : client;

  const isCreditNote = kind === 'invoices' && raw.documentType === 'credit_note';

  const title = isDeliveryNote
    ? 'Albarán'
    : isPurchaseOrder
      ? 'Orden de compra'
      : kind === 'quotes'
        ? 'Presupuesto'
        : kind === 'orders'
          ? 'Pedido'
          : isCreditNote
            ? 'Factura rectificativa'
            : 'Factura';

  const docNumber = isDeliveryNote
    ? String(raw.deliveryNoteNumber ?? raw.number ?? '—')
    : String(raw.number ?? '—');

  const date = String(
    (isDeliveryNote ? raw.deliveredAt : raw.issueDate ?? raw.orderDate ?? raw.quoteDate ?? raw.expectedDate)
      ?.toString()
      .slice(0, 10) ?? '—',
  );

  const statusMap = isPurchaseOrder
    ? PO_STATUS_LABELS
    : kind === 'quotes'
      ? QUOTE_STATUS_LABELS
      : kind === 'orders' || isDeliveryNote
        ? ORDER_STATUS_LABELS
        : INVOICE_STATUS_LABELS;

  const backPath = isDeliveryNote
    ? `/orders/${id}`
    : isPurchaseOrder
      ? `/purchase-orders/${id}`
      : `/${kind}/${id}`;

  const partyLabel = isPurchaseOrder ? 'Proveedor' : 'Cliente';
  const showPrices = !isDeliveryNote;
  const orderRef = isDeliveryNote ? String(raw.number ?? '') : '';

  return (
    <div className="domo-print-page mx-auto max-w-3xl space-y-4 p-4 print:max-w-none print:space-y-0 print:p-0">
      <div className="flex gap-2 print:hidden">
        <Button variant="secondary" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </Button>
        <Link to={backPath} className="self-center text-sm text-muted-foreground hover:underline">
          Editar documento
        </Link>
      </div>

      {showPdfWatermark && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 print:hidden dark:text-amber-200">
          Plan Free: los PDF incluyen marca de agua.{' '}
          <Link to="/settings?tab=billing" className="font-medium underline">
            Actualizar a Premium
          </Link>
        </p>
      )}

      <article className="domo-print-sheet overflow-hidden rounded-2xl border border-border/60 bg-card text-foreground shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <PrintPlanWatermark enabled={showPdfWatermark} text={watermarkText} />
        <div className="domo-print-brand flex items-center justify-between gap-4 bg-primary px-8 py-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15 text-lg font-bold tracking-tight">
              D
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight">Domo</p>
              <p className="text-xs text-primary-foreground/75">ERP · Gestión empresarial</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.15em] text-primary-foreground/70">{title}</p>
            <p className="font-mono text-lg font-semibold">{docNumber}</p>
            {isDeliveryNote && orderRef && (
              <p className="text-xs text-primary-foreground/75">Pedido {orderRef}</p>
            )}
            {isCreditNote && Boolean((raw.originalInvoice as { number?: string } | null)?.number) && (
              <p className="text-xs text-primary-foreground/75">
                Rectifica {(raw.originalInvoice as { number: string }).number}
              </p>
            )}
          </div>
        </div>

        <div className="domo-print-body space-y-8 bg-background/60 px-8 py-8 dark:bg-background/40">
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Emisor</p>
              <p className="text-lg font-semibold">{company?.name ?? 'Domo Demo'}</p>
              {company?.taxId && (
                <p className="text-sm text-muted-foreground">NIF/CIF: {company.taxId}</p>
              )}
              {company?.address && (
                <p className="text-sm text-muted-foreground">{company.address}</p>
              )}
              {(company?.postalCode || company?.city) && (
                <p className="text-sm text-muted-foreground">
                  {[company.postalCode, company.city].filter(Boolean).join(' ')}
                  {company.country ? ` · ${company.country}` : ''}
                </p>
              )}
              {company?.email && (
                <p className="text-sm text-muted-foreground">{company.email}</p>
              )}
              {company?.phone && (
                <p className="text-sm text-muted-foreground">{company.phone}</p>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-card px-5 py-4 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Documento</p>
              <dl className="mt-2 space-y-1.5">
                <div className="flex justify-between gap-8">
                  <dt className="text-muted-foreground">{isDeliveryNote ? 'Entrega' : 'Fecha'}</dt>
                  <dd className="font-medium">{date}</dd>
                </div>
                {!isDeliveryNote && (
                  <div className="flex justify-between gap-8">
                    <dt className="text-muted-foreground">Estado</dt>
                    <dd className="font-medium">{statusLabel(statusMap, String(raw.status ?? ''))}</dd>
                  </div>
                )}
                {isDeliveryNote && Boolean(raw.trackingNumber) && (
                  <div className="flex justify-between gap-8">
                    <dt className="text-muted-foreground">Seguimiento</dt>
                    <dd className="font-medium">{String(raw.trackingNumber)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </header>

          <section className="rounded-xl border border-border/70 bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{partyLabel}</p>
            <p className="mt-1 text-base font-semibold">{party?.name ?? '—'}</p>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {party?.taxId && <p>NIF: {party.taxId}</p>}
              {party?.address && <p>{party.address}</p>}
              {party?.city && <p>{party.city}</p>}
              {party?.email && <p>{party.email}</p>}
            </div>
            {isDeliveryNote && Boolean(raw.deliveryAddress) && (
              <div className="mt-3 border-t border-border/50 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dirección de entrega</p>
                <p className="mt-1 text-sm">{String(raw.deliveryAddress)}</p>
              </div>
            )}
          </section>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/80 text-left">
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold text-right">Cant.</th>
                  {showPrices && (
                    <>
                      <th className="px-4 py-3 font-semibold text-right">Precio</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-t border-border/50 even:bg-muted/30">
                    <td className="px-4 py-3">{line.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(line.quantity)}</td>
                    {showPrices && (
                      <>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(Number(line.unitPrice))}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatMoney(
                            Number(line.lineTotal ?? Number(line.quantity) * Number(line.unitPrice)),
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showPrices && (
            <div className="flex justify-end">
              <div className="w-full max-w-xs overflow-hidden rounded-xl border border-border/70 bg-card text-sm">
                <div className="space-y-2 px-5 py-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base imponible</span>
                    <span className="tabular-nums">{formatMoney(Number(raw.subtotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA ({Number(raw.taxRate)}%)</span>
                    <span className="tabular-nums">{formatMoney(Number(raw.taxAmount))}</span>
                  </div>
                </div>
                <div className="domo-print-total flex justify-between bg-primary px-5 py-3 text-base font-bold text-primary-foreground">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(Number(raw.total))}</span>
                </div>
              </div>
            </div>
          )}

          {isCreditNote && (
            <section className="rounded-xl border border-border/70 bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Motivo de la rectificación
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {String(raw.creditReason ?? '—')}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Documento emitido como factura rectificativa conforme al art. 15 del Reglamento de
                facturación (RD 1619/2012).
              </p>
            </section>
          )}

          {(Boolean(raw.notes) || (isDeliveryNote && Boolean(raw.deliveryNotes))) && (
            <section className="rounded-xl border border-dashed border-border/70 bg-card/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {isDeliveryNote && raw.deliveryNotes ? 'Observaciones de entrega' : 'Notas'}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {String(isDeliveryNote && raw.deliveryNotes ? raw.deliveryNotes : raw.notes)}
              </p>
            </section>
          )}

          <footer className="domo-print-footer flex items-center justify-between border-t border-border/60 pt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
                D
              </span>
              <span>
                {showPdfWatermark ? (
                  watermarkText
                ) : (
                  <>
                    Generado con <strong className="text-foreground">Domo</strong>
                  </>
                )}
              </span>
            </div>
            <span>{company?.name ?? 'Domo'}</span>
          </footer>
        </div>
      </article>
    </div>
  );
}
