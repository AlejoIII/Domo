import { sanitizeDocumentLines } from '@/lib/document-payload';
import type { DocLine } from '@/types/document.types';

export function lineTotal(line: DocLine): number {
  return Number(line.quantity || 0) * Number(line.unitPrice || 0);
}

export function calcDocTotals(lines: DocLine[], taxRate: number) {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const taxAmount = subtotal * (Number(taxRate) / 100);
  const total = subtotal + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function toLinePayloads(lines: DocLine[]) {
  return sanitizeDocumentLines(lines);
}
