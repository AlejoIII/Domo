import { api } from './api';
import { sanitizeDocumentPayload } from '@/lib/document-payload';
import type {
  CreateCreditNotePayload,
  CreatePaymentPayload,
  Invoice,
  InvoicePayload,
  InvoicePayment,
  InvoicesListResponse,
} from '@/types/invoice.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function fetchInvoices(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  documentType?: string;
  clientId?: string;
  overdue?: boolean;
}): Promise<InvoicesListResponse> {
  const res = await api.get('/invoices', {
    params: {
      ...params,
      overdue: params.overdue ? '1' : undefined,
    },
  });
  return unwrap<InvoicesListResponse>(res.data);
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const res = await api.get(`/invoices/${id}`);
  return unwrap<Invoice>(res.data);
}

export async function createInvoice(payload: InvoicePayload): Promise<Invoice> {
  const res = await api.post('/invoices', sanitizeDocumentPayload(payload));
  return unwrap<Invoice>(res.data);
}

export async function updateInvoice(id: string, payload: InvoicePayload): Promise<Invoice> {
  const res = await api.patch(`/invoices/${id}`, sanitizeDocumentPayload(payload));
  return unwrap<Invoice>(res.data);
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/invoices/${id}`);
}

export async function fetchInvoicePayments(invoiceId: string): Promise<InvoicePayment[]> {
  const res = await api.get(`/invoices/${invoiceId}/payments`);
  return unwrap<InvoicePayment[]>(res.data);
}

export async function createInvoicePayment(
  invoiceId: string,
  payload: CreatePaymentPayload,
): Promise<InvoicePayment> {
  const res = await api.post(`/invoices/${invoiceId}/payments`, payload);
  return unwrap<InvoicePayment>(res.data);
}

export async function deleteInvoicePayment(paymentId: string): Promise<void> {
  await api.delete(`/invoices/payments/${paymentId}`);
}

export async function duplicateInvoice(id: string): Promise<Invoice> {
  const res = await api.post(`/invoices/${id}/duplicate`);
  return unwrap<Invoice>(res.data);
}

export async function sendInvoiceEmail(
  id: string,
  to?: string,
): Promise<{ message: string; to: string }> {
  const res = await api.post(`/invoices/${id}/send-email`, to ? { to } : {});
  return unwrap(res.data);
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const res = await api.post(`/invoices/${id}/cancel`);
  return unwrap<Invoice>(res.data);
}

export async function createCreditNote(
  invoiceId: string,
  payload: CreateCreditNotePayload,
): Promise<Invoice> {
  const res = await api.post(`/invoices/${invoiceId}/credit-note`, payload);
  return unwrap<Invoice>(res.data);
}

export async function downloadInvoicePdf(id: string, number: string): Promise<void> {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  downloadBlob(res.data as Blob, `${number}.pdf`);
}

