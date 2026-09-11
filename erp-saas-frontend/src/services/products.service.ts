import { api } from './api';
import type { Product, ProductPayload, ProductsListResponse } from '@/types/product.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active?: string;
  lowStock?: boolean;
}): Promise<ProductsListResponse> {
  const res = await api.get('/products', {
    params: {
      ...params,
      lowStock: params.lowStock ? '1' : undefined,
    },
  });
  return unwrap<ProductsListResponse>(res.data);
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await api.get(`/products/${id}`);
  return unwrap<Product>(res.data);
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const res = await api.post('/products', payload);
  return unwrap<Product>(res.data);
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  const res = await api.patch(`/products/${id}`, payload);
  return unwrap<Product>(res.data);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}
