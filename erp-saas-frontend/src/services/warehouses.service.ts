import { api } from './api';
import type {
  Warehouse,
  WarehousePayload,
  WarehousesListResponse,
  WarehouseStockPayload,
} from '@/types/warehouse.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchWarehouses(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<WarehousesListResponse> {
  const res = await api.get('/warehouses', { params });
  return unwrap<WarehousesListResponse>(res.data);
}

export async function fetchWarehouse(id: string): Promise<Warehouse> {
  const res = await api.get(`/warehouses/${id}`);
  return unwrap<Warehouse>(res.data);
}

export async function createWarehouse(payload: WarehousePayload): Promise<Warehouse> {
  const res = await api.post('/warehouses', payload);
  return unwrap<Warehouse>(res.data);
}

export async function updateWarehouse(id: string, payload: WarehousePayload): Promise<Warehouse> {
  const res = await api.patch(`/warehouses/${id}`, payload);
  return unwrap<Warehouse>(res.data);
}

export async function deleteWarehouse(id: string): Promise<void> {
  await api.delete(`/warehouses/${id}`);
}

export async function adjustWarehouseStock(
  id: string,
  payload: WarehouseStockPayload,
): Promise<Warehouse> {
  const res = await api.patch(`/warehouses/${id}/stock`, payload);
  return unwrap<Warehouse>(res.data);
}
