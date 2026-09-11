import { api } from './api';

export interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  transferGroupId?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: { id: string; code: string; name: string };
  warehouse?: { id: string; code: string; name: string };
}

export interface ProductStockBreakdown {
  productId: string;
  total: number;
  warehouses: Array<{
    warehouseId: string;
    quantity: number;
    warehouse: { id: string; code: string; name: string };
  }>;
}

export interface StockValuationReport {
  summary: {
    totalValue: number;
    totalUnits: number;
    lineCount: number;
  };
  byWarehouse: Array<{
    warehouseId: string;
    warehouse: { id: string; code: string; name: string };
    quantity: number;
    value: number;
  }>;
  lines: Array<{
    warehouseId: string;
    warehouse: { id: string; code: string; name: string };
    productId: string;
    product: { id: string; code: string; name: string; cost?: number | null };
    quantity: number;
    unitCost: number;
    valuation: number;
  }>;
}

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(header?: string, fallback = 'export.csv') {
  if (!header) return fallback;
  const match = header.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

export async function fetchStockMovements(params: {
  page?: number;
  limit?: number;
  productId?: string;
  warehouseId?: string;
  type?: string;
  referenceType?: string;
  from?: string;
  to?: string;
  search?: string;
}) {
  const res = await api.get('/inventory/movements', { params });
  return unwrap<{
    items: StockMovement[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(res.data);
}

export async function exportStockMovements(params: {
  productId?: string;
  warehouseId?: string;
  type?: string;
  referenceType?: string;
  from?: string;
  to?: string;
  search?: string;
}): Promise<void> {
  const res = await api.get('/inventory/movements/export', {
    params,
    responseType: 'blob',
  });
  const fallback = `movimientos_stock_${new Date().toISOString().slice(0, 10)}.csv`;
  const filename = filenameFromDisposition(res.headers['content-disposition'], fallback);
  downloadBlob(res.data, filename);
}

export async function createStockTransfer(payload: {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  notes?: string;
}) {
  const res = await api.post('/inventory/transfers', payload);
  return unwrap(res.data);
}

export async function fetchStockValuation(params?: { warehouseId?: string }): Promise<StockValuationReport> {
  const res = await api.get('/inventory/valuation', { params });
  return unwrap<StockValuationReport>(res.data);
}

export async function exportStockValuation(params?: { warehouseId?: string }): Promise<void> {
  const res = await api.get('/inventory/valuation/export', {
    params,
    responseType: 'blob',
  });
  const fallback = `valoracion_stock_${new Date().toISOString().slice(0, 10)}.csv`;
  const filename = filenameFromDisposition(res.headers['content-disposition'], fallback);
  downloadBlob(res.data, filename);
}

export async function fetchProductStock(productId: string): Promise<ProductStockBreakdown> {
  const res = await api.get(`/products/${productId}/stock`);
  return unwrap<ProductStockBreakdown>(res.data);
}
