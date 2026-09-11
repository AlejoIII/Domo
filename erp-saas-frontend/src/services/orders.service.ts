import { api } from './api';
import { sanitizeDocumentPayload } from '@/lib/document-payload';
import type { SalesOrder, OrderPayload, OrdersListResponse } from '@/types/order.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchOrders(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: string;
  from?: string;
  to?: string;
}): Promise<OrdersListResponse> {
  const res = await api.get('/orders', { params });
  return unwrap<OrdersListResponse>(res.data);
}

export async function fetchOrder(id: string): Promise<SalesOrder> {
  const res = await api.get(`/orders/${id}`);
  return unwrap<SalesOrder>(res.data);
}

export async function createOrder(payload: OrderPayload): Promise<SalesOrder> {
  const res = await api.post('/orders', sanitizeDocumentPayload(payload));
  return unwrap<SalesOrder>(res.data);
}

export async function updateOrder(id: string, payload: OrderPayload): Promise<SalesOrder> {
  const res = await api.patch(`/orders/${id}`, sanitizeDocumentPayload(payload));
  return unwrap<SalesOrder>(res.data);
}

export async function markOrderDelivered(id: string): Promise<SalesOrder> {
  const res = await api.patch(`/orders/${id}`, { status: 'delivered' });
  return unwrap<SalesOrder>(res.data);
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/orders/${id}`);
}

export async function convertOrderToInvoice(id: string): Promise<unknown> {
  const res = await api.post(`/orders/${id}/convert-to-invoice`);
  return unwrap(res.data);
}

export async function duplicateOrder(id: string): Promise<SalesOrder> {
  const res = await api.post(`/orders/${id}/duplicate`);
  return unwrap<SalesOrder>(res.data);
}

export async function unconfirmOrder(id: string): Promise<SalesOrder> {
  const res = await api.post(`/orders/${id}/unconfirm`);
  return unwrap<SalesOrder>(res.data);
}
