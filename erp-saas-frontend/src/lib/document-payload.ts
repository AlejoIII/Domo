import type { DocLine, DocLinePayload } from '@/types/document.types';

type DocumentPayloadBase = {
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  taxBreakdown?: unknown;
  lines?: DocLine[];
};

/** Campos calculados en cliente que el API no acepta (ValidationPipe forbidNonWhitelisted). */
export function sanitizeDocumentLines(lines: DocLine[]): DocLinePayload[] {
  return lines.map(({ productId, description, quantity, unitPrice, taxRate }) => ({
    ...(productId ? { productId } : {}),
    description,
    quantity: Number(quantity),
    unitPrice: Number(unitPrice),
    ...(taxRate !== undefined && taxRate !== null ? { taxRate: Number(taxRate) } : {}),
  }));
}

export function sanitizeDocumentPayload<T extends DocumentPayloadBase>(
  payload: T,
): Omit<T, 'subtotal' | 'taxAmount' | 'total' | 'taxBreakdown'> {
  const { subtotal: _s, taxAmount: _t, total: _tot, taxBreakdown: _b, lines, ...rest } = payload;

  return {
    ...rest,
    ...(lines ? { lines: sanitizeDocumentLines(lines) } : {}),
  } as Omit<T, 'subtotal' | 'taxAmount' | 'total' | 'taxBreakdown'>;
}
