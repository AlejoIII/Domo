import { useCompanyStore } from '@/store/company.store';
import { usePreferencesStore, type DateFormat } from '@/store/preferences.store';

function parseDate(value: Date | string): Date | null {
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatDate(value: Date | string | null | undefined): string {
  if (value == null) return '—';
  const d = parseDate(value);
  if (!d) return '—';

  const dateFormat = usePreferencesStore.getState().dateFormat as DateFormat;
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  switch (dateFormat) {
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (value == null) return '—';
  const d = parseDate(value);
  if (!d) return '—';

  const language = usePreferencesStore.getState().language;
  const locale = language === 'en' ? 'en-GB' : 'es-ES';
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMoney(n: number): string {
  const currency = useCompanyStore.getState().currency || 'EUR';
  const locale =
    currency === 'USD' ? 'en-US' : currency === 'GBP' ? 'en-GB' : 'es-ES';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
}
