import { api } from './api';
import type { Category, CategoryPayload, CategoriesListResponse } from '@/types/category.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchCategories(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CategoriesListResponse> {
  const res = await api.get('/categories', { params });
  return unwrap<CategoriesListResponse>(res.data);
}

export async function fetchCategory(id: string): Promise<Category> {
  const res = await api.get(`/categories/${id}`);
  return unwrap<Category>(res.data);
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const res = await api.post('/categories', payload);
  return unwrap<Category>(res.data);
}

export async function updateCategory(id: string, payload: CategoryPayload): Promise<Category> {
  const res = await api.patch(`/categories/${id}`, payload);
  return unwrap<Category>(res.data);
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
