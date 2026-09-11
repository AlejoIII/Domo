import { api } from './api';
import type { Bom, ManufacturingOrder } from '@/types/manufacturing.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchBoms(params?: { search?: string; productId?: string }) {
  const res = await api.get('/manufacturing/boms', { params });
  return unwrap<Bom[]>(res.data);
}

export async function createBom(payload: {
  productId: string;
  name?: string;
  notes?: string;
  lines: { componentProductId: string; quantity: number }[];
}) {
  const res = await api.post('/manufacturing/boms', payload);
  return unwrap<Bom>(res.data);
}

export async function updateBom(
  id: string,
  payload: {
    name?: string;
    notes?: string;
    isActive?: boolean;
    lines?: { componentProductId: string; quantity: number }[];
  },
) {
  const res = await api.patch(`/manufacturing/boms/${id}`, payload);
  return unwrap<Bom>(res.data);
}

export async function deleteBom(id: string) {
  await api.delete(`/manufacturing/boms/${id}`);
}

export async function fetchManufacturingOrders(params?: {
  status?: string;
  search?: string;
}) {
  const res = await api.get('/manufacturing/orders', { params });
  return unwrap<ManufacturingOrder[]>(res.data);
}

export async function createManufacturingOrder(payload: {
  bomId: string;
  quantity: number;
  warehouseId?: string;
  plannedDate?: string;
  notes?: string;
}) {
  const res = await api.post('/manufacturing/orders', payload);
  return unwrap<ManufacturingOrder>(res.data);
}

export async function completeManufacturingOrder(id: string) {
  const res = await api.post(`/manufacturing/orders/${id}/complete`);
  return unwrap<ManufacturingOrder>(res.data);
}

export async function cancelManufacturingOrder(id: string) {
  const res = await api.post(`/manufacturing/orders/${id}/cancel`);
  return unwrap<ManufacturingOrder>(res.data);
}

export async function revertManufacturingOrder(id: string) {
  const res = await api.post(`/manufacturing/orders/${id}/revert`);
  return unwrap<ManufacturingOrder>(res.data);
}

export async function deleteManufacturingOrder(id: string) {
  await api.delete(`/manufacturing/orders/${id}`);
}
