import { sanitizeDocumentLines } from '@/lib/document-payload';
import type { DocLine } from '@/types/document.types';

export type TaxBreakdownRow = {
  taxRate: number;
  base: number;
  taxAmount: number;
};

export function lineTotal(line: DocLine): number {
  return Number(line.quantity || 0) * Number(line.unitPrice || 0);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function calcDocTotals(lines: DocLine[], defaultTaxRate: number) {
  const subtotal = round2(lines.reduce((sum, line) => sum + lineTotal(line), 0));
  const byRate = new Map<number, number>();

  for (const line of lines) {
    const rate =
      line.taxRate === undefined || line.taxRate === null
        ? Number(defaultTaxRate)
        : Number(line.taxRate);
    byRate.set(rate, round2((byRate.get(rate) ?? 0) + lineTotal(line)));
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
    subtotal,
    taxAmount,
    total,
    taxBreakdown,
  };
}

export function toLinePayloads(lines: DocLine[]) {
  return sanitizeDocumentLines(lines);
}
