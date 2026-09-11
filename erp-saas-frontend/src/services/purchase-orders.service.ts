import { api } from './api';
import { sanitizeDocumentPayload } from '@/lib/document-payload';
import type {
  PurchaseOrder,
  PurchaseOrderPayload,
  PurchaseOrdersListResponse,
} from '@/types/purchase-order.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchPurchaseOrders(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
  from?: string;
  to?: string;
}): Promise<PurchaseOrdersListResponse> {
  const res = await api.get('/purchase-orders', { params });
  return unwrap<PurchaseOrdersListResponse>(res.data);
}

export async function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const res = await api.get(`/purchase-orders/${id}`);
  return unwrap<PurchaseOrder>(res.data);
}

export async function createPurchaseOrder(payload: PurchaseOrderPayload): Promise<PurchaseOrder> {
  const res = await api.post('/purchase-orders', sanitizeDocumentPayload(payload));
  return unwrap<PurchaseOrder>(res.data);
}

export async function updatePurchaseOrder(
  id: string,
  payload: PurchaseOrderPayload,
): Promise<PurchaseOrder> {
  const res = await api.patch(`/purchase-orders/${id}`, sanitizeDocumentPayload(payload));
  return unwrap<PurchaseOrder>(res.data);
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await api.delete(`/purchase-orders/${id}`);
}

export async function duplicatePurchaseOrder(id: string): Promise<PurchaseOrder> {
  const res = await api.post(`/purchase-orders/${id}/duplicate`);
  return unwrap<PurchaseOrder>(res.data);
}
