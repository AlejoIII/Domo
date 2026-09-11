export type DocumentLineInput = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ComputedDocumentLine = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type DocumentTotals = {
  lines: ComputedDocumentLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcLines(
  lines: DocumentLineInput[],
  taxRate = 21,
): DocumentTotals {
  const computed = lines.map((line) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    return {
      productId: line.productId,
      description: line.description,
      quantity,
      unitPrice,
      lineTotal: round2(quantity * unitPrice),
    };
  });

  const subtotal = round2(computed.reduce((sum, l) => sum + l.lineTotal, 0));
  const taxAmount = round2((subtotal * taxRate) / 100);
  const total = round2(subtotal + taxAmount);

  return { lines: computed, subtotal, taxAmount, total, taxRate };
}

export function formatDocumentNumber(prefix: string, seq: number, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${prefix}-${y}${m}${d}-${String(seq).padStart(4, '0')}`;
}
