import { api } from './api';
import { sanitizeDocumentPayload } from '@/lib/document-payload';
import type { Quote, QuotePayload, QuotesListResponse } from '@/types/quote.types';

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

export async function fetchQuotes(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<QuotesListResponse> {
  const res = await api.get('/quotes', { params });
  return unwrap<QuotesListResponse>(res.data);
}

export async function fetchQuote(id: string): Promise<Quote> {
  const res = await api.get(`/quotes/${id}`);
  return unwrap<Quote>(res.data);
}

export async function createQuote(payload: QuotePayload): Promise<Quote> {
  const res = await api.post('/quotes', sanitizeDocumentPayload(payload));
  return unwrap<Quote>(res.data);
}

export async function updateQuote(id: string, payload: QuotePayload): Promise<Quote> {
  const res = await api.patch(`/quotes/${id}`, sanitizeDocumentPayload(payload));
  return unwrap<Quote>(res.data);
}

export async function deleteQuote(id: string): Promise<void> {
  await api.delete(`/quotes/${id}`);
}

export async function convertQuoteToOrder(id: string): Promise<unknown> {
  const res = await api.post(`/quotes/${id}/convert-to-order`);
  return unwrap(res.data);
}

export async function duplicateQuote(id: string): Promise<Quote> {
  const res = await api.post(`/quotes/${id}/duplicate`);
  return unwrap<Quote>(res.data);
}

export async function sendQuoteEmail(id: string, to?: string): Promise<{ message: string; to: string }> {
  const res = await api.post(`/quotes/${id}/send-email`, to ? { to } : {});
  return unwrap(res.data);
}

export async function downloadQuotePdf(id: string, number: string): Promise<void> {
  const res = await api.get(`/quotes/${id}/pdf`, { responseType: 'blob' });
  downloadBlob(res.data as Blob, `${number}.pdf`);
}
