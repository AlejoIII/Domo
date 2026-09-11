import {
  computeInvoiceBalances,
  resolveStatusAfterPayment,
  sumCreditNotes,
  sumPayments,
} from './invoice.mapper';

describe('invoice payment helpers', () => {
  describe('sumPayments', () => {
    it('sums payment amounts with two decimal precision', () => {
      expect(
        sumPayments([
          { amount: 10.1 as never },
          { amount: 20.205 as never },
        ]),
      ).toBe(30.31);
    });

    it('returns 0 for empty payments', () => {
      expect(sumPayments([])).toBe(0);
    });
  });

  describe('resolveStatusAfterPayment', () => {
    it('marks invoice as paid when total is covered', () => {
      expect(resolveStatusAfterPayment('issued', 100, 100)).toBe('paid');
      expect(resolveStatusAfterPayment('partially_paid', 100, 99.999)).toBe('paid');
    });

    it('marks invoice as partially paid', () => {
      expect(resolveStatusAfterPayment('issued', 100, 40)).toBe('partially_paid');
    });

    it('keeps issued when no payments', () => {
      expect(resolveStatusAfterPayment('issued', 100, 0)).toBe('issued');
    });

    it('does not change draft or cancelled statuses', () => {
      expect(resolveStatusAfterPayment('draft', 100, 100)).toBe('draft');
      expect(resolveStatusAfterPayment('cancelled', 100, 0)).toBe('cancelled');
    });

    it('marks invoice as credited when fully rectified', () => {
      expect(resolveStatusAfterPayment('issued', 100, 0, 100)).toBe('credited');
    });

    it('settles invoice combining payments and credit notes', () => {
      expect(resolveStatusAfterPayment('partially_paid', 100, 60, 40)).toBe('paid');
    });

    it('keeps partial state with a partial credit note', () => {
      expect(resolveStatusAfterPayment('issued', 100, 30, 20)).toBe('partially_paid');
    });
  });

  describe('sumCreditNotes', () => {
    it('ignores draft and cancelled credit notes', () => {
      expect(
        sumCreditNotes([
          { total: 50 as never, status: 'issued' },
          { total: 30 as never, status: 'draft' },
          { total: 20 as never, status: 'cancelled' },
        ]),
      ).toBe(50);
    });
  });

  describe('computeInvoiceBalances', () => {
    it('computes balance due and overdue flag', () => {
      const result = computeInvoiceBalances(
        {
          total: 121 as never,
          dueDate: new Date('2020-01-01'),
          status: 'issued',
        },
        [{ amount: 21 as never }],
      );

      expect(result.paidAmount).toBe(21);
      expect(result.balanceDue).toBe(100);
      expect(result.isOverdue).toBe(true);
    });

    it('reduces balance due with issued credit notes', () => {
      const result = computeInvoiceBalances(
        {
          total: 121 as never,
          dueDate: new Date('2020-01-01'),
          status: 'issued',
        },
        [{ amount: 21 as never }],
        [{ total: 100 as never, status: 'issued' }],
      );

      expect(result.creditedAmount).toBe(100);
      expect(result.balanceDue).toBe(0);
      expect(result.isFullyCredited).toBe(false);
      expect(result.isOverdue).toBe(false);
    });

    it('flags fully credited invoices', () => {
      const result = computeInvoiceBalances(
        { total: 121 as never, dueDate: null, status: 'issued' },
        [],
        [{ total: 121 as never, status: 'issued' }],
      );

      expect(result.isFullyCredited).toBe(true);
      expect(result.balanceDue).toBe(0);
    });
  });
});
