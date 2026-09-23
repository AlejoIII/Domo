import { calcLines, round2 } from './document-totals';

describe('calcLines multi-IVA', () => {
  it('keeps single-rate totals compatible with previous behaviour', () => {
    const totals = calcLines(
      [
        { description: 'A', quantity: 2, unitPrice: 50 },
        { description: 'B', quantity: 1, unitPrice: 20 },
      ],
      21,
    );

    expect(totals.subtotal).toBe(120);
    expect(totals.taxAmount).toBe(25.2);
    expect(totals.total).toBe(145.2);
    expect(totals.taxBreakdown).toEqual([
      { taxRate: 21, base: 120, taxAmount: 25.2 },
    ]);
    expect(totals.lines.every((l) => l.taxRate === 21)).toBe(true);
  });

  it('splits tax breakdown by line taxRate', () => {
    const totals = calcLines(
      [
        { description: 'Super', quantity: 1, unitPrice: 100, taxRate: 21 },
        { description: 'Reducido', quantity: 1, unitPrice: 50, taxRate: 10 },
        { description: 'Exento', quantity: 1, unitPrice: 30, taxRate: 0 },
      ],
      21,
    );

    expect(totals.subtotal).toBe(180);
    expect(totals.taxBreakdown).toEqual([
      { taxRate: 0, base: 30, taxAmount: 0 },
      { taxRate: 10, base: 50, taxAmount: 5 },
      { taxRate: 21, base: 100, taxAmount: 21 },
    ]);
    expect(totals.taxAmount).toBe(26);
    expect(totals.total).toBe(206);
  });

  it('uses header rate when line taxRate is omitted', () => {
    const totals = calcLines(
      [{ description: 'X', quantity: 1, unitPrice: 10, taxRate: null }],
      4,
    );
    expect(totals.lines[0].taxRate).toBe(4);
    expect(totals.taxAmount).toBe(0.4);
  });

  it('round2 half-up to cents', () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });
});
