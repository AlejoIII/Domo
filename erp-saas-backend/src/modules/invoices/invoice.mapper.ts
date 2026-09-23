import { Payment, Invoice, InvoiceLine } from '@prisma/client';

export type CreditNoteRef = Pick<Invoice, 'id' | 'number' | 'status' | 'total' | 'issueDate'> & {
  creditReason?: string | null;
};

type InvoiceRecord = Invoice & {
  lines: InvoiceLine[];
  payments?: Payment[];
  client?: { id: string; name: string; taxId?: string | null } | null;
  creditNotes?: CreditNoteRef[];
  originalInvoice?: { id: string; number: string; issueDate?: Date } | null;
  verifactuRecords?: Array<{
    id: string;
    recordType: string;
    invoiceType: string | null;
    aeatStatus: string;
    aeatCsv: string | null;
    huella: string;
    qrPayload: string | null;
    sequenceNo: number;
    createdAt: Date;
    aeatError: string | null;
  }>;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function sumPayments(payments: Pick<Payment, 'amount'>[]) {
  return roundMoney(payments.reduce((sum, p) => sum + Number(p.amount), 0));
}

/** Solo las rectificativas vigentes reducen el saldo de la factura original. */
export function sumCreditNotes(creditNotes: Pick<Invoice, 'total' | 'status'>[]) {
  const effective = creditNotes.filter((n) => !['draft', 'cancelled'].includes(n.status));
  return roundMoney(effective.reduce((sum, n) => sum + Number(n.total), 0));
}

export function computeInvoiceBalances(
  invoice: Pick<Invoice, 'total' | 'dueDate' | 'status'>,
  payments: Pick<Payment, 'amount'>[],
  creditNotes: Pick<Invoice, 'total' | 'status'>[] = [],
) {
  const total = Number(invoice.total);
  const paidAmount = sumPayments(payments);
  const creditedAmount = sumCreditNotes(creditNotes);
  const balanceDue = roundMoney(Math.max(0, total - paidAmount - creditedAmount));
  const isFullyCredited = creditedAmount >= total - 0.001 && total > 0;
  const isOverdue =
    balanceDue > 0
    && !!invoice.dueDate
    && new Date(invoice.dueDate) < new Date()
    && ['issued', 'partially_paid'].includes(invoice.status);

  return { paidAmount, creditedAmount, balanceDue, isFullyCredited, isOverdue };
}

export function mapPayment(payment: Payment) {
  return {
    ...payment,
    amount: Number(payment.amount),
    paymentDate: payment.paymentDate.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}

function mapCreditNoteRef(note: CreditNoteRef) {
  return {
    id: note.id,
    number: note.number,
    status: note.status,
    total: Number(note.total),
    issueDate: note.issueDate.toISOString(),
    creditReason: note.creditReason ?? null,
  };
}

export function mapInvoice(invoice: InvoiceRecord) {
  const payments = invoice.payments ?? [];
  const creditNotes = invoice.creditNotes ?? [];
  const { paidAmount, creditedAmount, balanceDue, isFullyCredited, isOverdue } =
    computeInvoiceBalances(invoice, payments, creditNotes);

  return {
    id: invoice.id,
    companyId: invoice.companyId,
    number: invoice.number,
    clientId: invoice.clientId,
    orderId: invoice.orderId,
    status: invoice.status,
    documentType: invoice.documentType,
    originalInvoiceId: invoice.originalInvoiceId,
    originalInvoice: invoice.originalInvoice
      ? {
          id: invoice.originalInvoice.id,
          number: invoice.originalInvoice.number,
          ...(invoice.originalInvoice.issueDate
            ? { issueDate: invoice.originalInvoice.issueDate.toISOString() }
            : {}),
        }
      : null,
    creditReason: invoice.creditReason,
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate?.toISOString() ?? null,
    notes: invoice.notes,
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
    paidAmount,
    creditedAmount,
    balanceDue,
    isFullyCredited,
    isOverdue,
    client: invoice.client,
    lines: invoice.lines.map((line) => ({
      ...line,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      lineTotal: Number(line.lineTotal),
      taxRate: line.taxRate != null ? Number(line.taxRate) : null,
    })),
    payments: payments.map(mapPayment),
    creditNotes: creditNotes.map(mapCreditNoteRef),
    verifactu: mapVerifactuSummary(invoice.verifactuRecords ?? []),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

function mapVerifactuSummary(
  records: NonNullable<InvoiceRecord['verifactuRecords']>,
) {
  if (!records.length) return null;
  const alta = records.find((r) => r.recordType === 'alta') ?? records[0];
  return {
    recordId: alta.id,
    recordType: alta.recordType,
    invoiceType: alta.invoiceType,
    aeatStatus: alta.aeatStatus,
    aeatCsv: alta.aeatCsv,
    huella: alta.huella,
    qrUrl: alta.qrPayload,
    sequenceNo: alta.sequenceNo,
    createdAt: alta.createdAt.toISOString(),
    aeatError: alta.aeatError,
    records: records.map((r) => ({
      id: r.id,
      recordType: r.recordType,
      aeatStatus: r.aeatStatus,
      sequenceNo: r.sequenceNo,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export function resolveStatusAfterPayment(
  currentStatus: string,
  total: number,
  paidAmount: number,
  creditedAmount = 0,
): string {
  if (currentStatus === 'draft' || currentStatus === 'cancelled') return currentStatus;
  if (creditedAmount >= total - 0.001 && total > 0) return 'credited';
  if (paidAmount + creditedAmount >= total - 0.001) return 'paid';
  if (paidAmount > 0) return 'partially_paid';
  return 'issued';
}
