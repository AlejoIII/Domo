import type { DocLine, DocLinePayload } from '@/types/document.types';

export interface InvoicePayment {
  id: string;
  companyId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export type InvoiceDocumentType = 'invoice' | 'credit_note';

export interface CreditNoteRef {
  id: string;
  number: string;
  status: string;
  total: number;
  issueDate: string;
  creditReason?: string | null;
}

export interface Invoice {
  id: string;
  companyId: string;
  number: string;
  clientId: string;
  orderId?: string | null;
  status: string;
  documentType?: InvoiceDocumentType;
  originalInvoiceId?: string | null;
  originalInvoice?: { id: string; number: string } | null;
  creditReason?: string | null;
  issueDate: string;
  dueDate?: string | null;
  notes?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  creditedAmount?: number;
  balanceDue?: number;
  isFullyCredited?: boolean;
  isOverdue?: boolean;
  client?: { id: string; name: string };
  lines: DocLine[];
  payments?: InvoicePayment[];
  creditNotes?: CreditNoteRef[];
  verifactu?: {
    recordId: string;
    recordType: string;
    invoiceType?: string | null;
    aeatStatus: string;
    aeatCsv?: string | null;
    huella: string;
    qrUrl?: string | null;
    sequenceNo: number;
    createdAt: string;
    aeatError?: string | null;
    records?: Array<{
      id: string;
      recordType: string;
      aeatStatus: string;
      sequenceNo: number;
      createdAt: string;
    }>;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicesListResponse {
  items: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoicePayload {
  clientId: string;
  orderId?: string;
  status?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  taxRate?: number;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  lines: DocLinePayload[];
}

export interface CreateCreditNotePayload {
  reason: string;
  issueDate?: string;
  notes?: string;
  lines?: DocLinePayload[];
}

export interface CreatePaymentPayload {
  amount: number;
  paymentDate?: string;
  method?: 'cash' | 'transfer' | 'card' | 'other';
  reference?: string;
  notes?: string;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  other: 'Otro',
};
