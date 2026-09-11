import type { DocLine, DocLinePayload } from '@/types/document.types';

export interface Quote {
  id: string;
  companyId: string;
  number: string;
  clientId: string;
  status: string;
  validUntil?: string | null;
  notes?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  client?: { id: string; name: string };
  lines: DocLine[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotesListResponse {
  items: Quote[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QuotePayload {
  clientId: string;
  status?: string;
  validUntil?: string;
  notes?: string;
  taxRate?: number;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  lines: DocLinePayload[];
}
