export interface WarehouseStock {
  id?: string;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface Warehouse {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  stocks?: WarehouseStock[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehousesListResponse {
  items: Warehouse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WarehousePayload {
  code: string;
  name: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface WarehouseStockPayload {
  productId: string;
  quantity: number;
  notes?: string;
}
