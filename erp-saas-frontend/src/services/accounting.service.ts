import { api } from './api';
import type {
  Account,
  AccountingPeriodParams,
  JournalEntry,
  LedgerReport,
  TrialBalanceReport,
} from '@/types/accounting.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(header?: string, fallback = 'libro_diario.csv') {
  if (!header) return fallback;
  const match = header.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await api.get('/accounting/accounts');
  return unwrap<Account[]>(res.data);
}

export async function fetchJournal(params?: AccountingPeriodParams): Promise<JournalEntry[]> {
  const res = await api.get('/accounting/journal', { params });
  return unwrap<JournalEntry[]>(res.data);
}

export async function fetchLedger(
  accountId: string,
  params?: AccountingPeriodParams,
): Promise<LedgerReport | null> {
  const res = await api.get('/accounting/ledger', { params: { accountId, ...params } });
  const data = unwrap<LedgerReport | null>(res.data);
  return data;
}

export async function fetchTrialBalance(
  params?: AccountingPeriodParams,
): Promise<TrialBalanceReport> {
  const res = await api.get('/accounting/trial-balance', { params });
  return unwrap<TrialBalanceReport>(res.data);
}

export async function exportJournal(params?: AccountingPeriodParams): Promise<void> {
  const res = await api.get('/accounting/journal/export', {
    params,
    responseType: 'blob',
  });
  const fallback = `libro_diario_${new Date().toISOString().slice(0, 10)}.csv`;
  const filename = filenameFromDisposition(res.headers['content-disposition'], fallback);
  downloadBlob(res.data, filename);
}
