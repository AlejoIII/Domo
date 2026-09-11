import type { DocLine, DocLinePayload } from '@/types/document.types';

export interface SalesOrder {
  id: string;
  companyId: string;
  number: string;
  clientId: string;
  status: string;
  orderDate: string;
  notes?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  trackingNumber?: string | null;
  deliveryNotes?: string | null;
  deliveryAddress?: string | null;
  deliveryNoteNumber?: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  client?: { id: string; name: string };
  lines: DocLine[];
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListResponse {
  items: SalesOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderPayload {
  clientId: string;
  status?: string;
  orderDate?: string;
  notes?: string;
  shippedAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  deliveryNotes?: string;
  deliveryAddress?: string;
  taxRate?: number;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  lines: DocLinePayload[];
}
