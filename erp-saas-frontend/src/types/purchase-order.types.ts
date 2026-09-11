import type { DocLine, DocLinePayload } from '@/types/document.types';

export interface PurchaseOrder {
  id: string;
  companyId: string;
  number: string;
  supplierId: string;
  status: string;
  expectedDate?: string | null;
  notes?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  supplier?: { id: string; name: string };
  lines: DocLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrdersListResponse {
  items: PurchaseOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PurchaseOrderPayload {
  supplierId: string;
  status?: string;
  expectedDate?: string;
  notes?: string;
  taxRate?: number;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  lines: DocLinePayload[];
}
