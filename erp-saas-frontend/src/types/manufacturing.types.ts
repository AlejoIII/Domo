export interface BomLine {
  id: string;
  bomId: string;
  componentProductId: string;
  quantity: number;
  lineOrder: number;
  component: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
}

export interface Bom {
  id: string;
  companyId: string;
  productId: string;
  name?: string | null;
  notes?: string | null;
  isActive: boolean;
  product: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
  lines: BomLine[];
}

export interface ManufacturingOrder {
  id: string;
  companyId: string;
  number: string;
  bomId: string;
  productId: string;
  warehouseId?: string | null;
  quantity: number;
  quantityProduced: number;
  status: string;
  plannedDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  product: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
  warehouse?: {
    id: string;
    code: string;
    name: string;
  } | null;
  bom: Bom;
}
