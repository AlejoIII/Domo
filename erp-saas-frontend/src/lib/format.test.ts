import { beforeEach, describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from '@/lib/format';
import { useCompanyStore } from '@/store/company.store';
import { usePreferencesStore } from '@/store/preferences.store';

describe('formatters', () => {
  beforeEach(() => {
    useCompanyStore.setState({ currency: 'EUR', defaultTaxRate: 21 });
    usePreferencesStore.setState({ dateFormat: 'dd/MM/yyyy', language: 'es' });
  });

  it('formats money in EUR locale', () => {
    const formatted = formatMoney(1234.5);
    expect(formatted).toContain('€');
    expect(formatted.replace(/\s/g, '')).toMatch(/1234,50€|1\.234,50€/);
  });

  it('formats dates according to preference', () => {
    expect(formatDate('2026-07-22')).toBe('22/07/2026');

    usePreferencesStore.setState({ dateFormat: 'yyyy-MM-dd' });
    expect(formatDate('2026-07-22')).toBe('2026-07-22');
  });

  it('returns em dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});
