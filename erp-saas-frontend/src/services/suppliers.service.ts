import { api } from './api';
import type { Supplier, SupplierPayload, SuppliersListResponse } from '@/types/supplier.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchSuppliers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<SuppliersListResponse> {
  const res = await api.get('/suppliers', { params });
  return unwrap<SuppliersListResponse>(res.data);
}

export async function fetchSupplier(id: string): Promise<Supplier> {
  const res = await api.get(`/suppliers/${id}`);
  return unwrap<Supplier>(res.data);
}

export async function createSupplier(payload: SupplierPayload): Promise<Supplier> {
  const res = await api.post('/suppliers', payload);
  return unwrap<Supplier>(res.data);
}

export async function updateSupplier(id: string, payload: SupplierPayload): Promise<Supplier> {
  const res = await api.patch(`/suppliers/${id}`, payload);
  return unwrap<Supplier>(res.data);
}

export async function deleteSupplier(id: string): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}
