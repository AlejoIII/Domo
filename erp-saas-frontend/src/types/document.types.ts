export interface DocLine {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  /** IVA de la línea; si se omite usa el de cabecera */
  taxRate?: number | null;
}

export interface DocLinePayload {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}
