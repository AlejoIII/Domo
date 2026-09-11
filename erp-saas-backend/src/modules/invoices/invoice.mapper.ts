import { Payment, Invoice, InvoiceLine } from '@prisma/client';

export type CreditNoteRef = Pick<Invoice, 'id' | 'number' | 'status' | 'total' | 'issueDate'> & {
  creditReason?: string | null;
};

type InvoiceRecord = Invoice & {
  lines: InvoiceLine[];
  payments?: Payment[];
  client?: { id: string; name: string } | null;
  creditNotes?: CreditNoteRef[];
  originalInvoice?: { id: string; number: string } | null;
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
    originalInvoice: invoice.originalInvoice ?? null,
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
    })),
    payments: payments.map(mapPayment),
    creditNotes: creditNotes.map(mapCreditNoteRef),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
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
