export interface Category {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesListResponse {
  items: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryPayload {
  name: string;
  description?: string;
}
