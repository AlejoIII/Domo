export interface Product {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  cost?: number | null;
  stock: number;
  minStock: number;
  unit: string;
  barcode?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  items: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ProductPayload {
  code: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  barcode?: string;
  imageUrl?: string;
  isActive?: boolean;
}
