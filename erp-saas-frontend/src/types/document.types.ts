export interface DocLine {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

export interface DocLinePayload {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}
