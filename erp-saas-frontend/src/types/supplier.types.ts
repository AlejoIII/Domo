export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SuppliersListResponse {
  items: Supplier[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SupplierPayload {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
}
