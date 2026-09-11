export type PdfDocumentKind = 'invoice' | 'credit_note' | 'quote';

export interface PdfParty {
  name: string;
  taxId?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface PdfDocumentLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PdfDocumentData {
  kind: PdfDocumentKind;
  number: string;
  issueDate: Date;
  dueDate?: Date | null;
  status: string;
  notes?: string | null;
  /** Motivo de rectificación (solo rectificativas) */
  creditReason?: string | null;
  /** Número de la factura rectificada (solo rectificativas) */
  originalNumber?: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  balanceDue?: number;
  lines: PdfDocumentLine[];
  issuer: PdfParty;
  recipient: PdfParty;
  /** Texto de marca de agua (plan Free) */
  watermark?: string | null;
}

export const PDF_DOCUMENT_TITLES: Record<PdfDocumentKind, string> = {
  invoice: 'Factura',
  credit_note: 'Factura rectificativa',
  quote: 'Presupuesto',
};
