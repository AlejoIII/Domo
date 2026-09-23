export type DocumentLineInput = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Si se omite, se usa el taxRate de cabecera */
  taxRate?: number | null;
};

export type ComputedDocumentLine = {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxRate: number;
};

export type TaxBreakdownRow = {
  taxRate: number;
  base: number;
  taxAmount: number;
};

export type DocumentTotals = {
  lines: ComputedDocumentLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  /** Tipo IVA de cabecera (default / predominante) */
  taxRate: number;
  taxBreakdown: TaxBreakdownRow[];
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcLines(
  lines: DocumentLineInput[],
  defaultTaxRate = 21,
): DocumentTotals {
  const computed = lines.map((line) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);
    const taxRate =
      line.taxRate === undefined || line.taxRate === null
        ? defaultTaxRate
        : Number(line.taxRate);
    return {
      productId: line.productId,
      description: line.description,
      quantity,
      unitPrice,
      lineTotal: round2(quantity * unitPrice),
      taxRate,
    };
  });

  const subtotal = round2(computed.reduce((sum, l) => sum + l.lineTotal, 0));

  const byRate = new Map<number, number>();
  for (const line of computed) {
    byRate.set(line.taxRate, round2((byRate.get(line.taxRate) ?? 0) + line.lineTotal));
  }

  const taxBreakdown: TaxBreakdownRow[] = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([taxRate, base]) => ({
      taxRate,
      base,
      taxAmount: round2((base * taxRate) / 100),
    }));

  const taxAmount = round2(taxBreakdown.reduce((sum, row) => sum + row.taxAmount, 0));
  const total = round2(subtotal + taxAmount);

  return {
    lines: computed,
    subtotal,
    taxAmount,
    total,
    taxRate: defaultTaxRate,
    taxBreakdown,
  };
}

export function formatDocumentNumber(prefix: string, seq: number, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${prefix}-${y}${m}${d}-${String(seq).padStart(4, '0')}`;
}
