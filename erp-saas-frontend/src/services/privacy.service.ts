import { api } from './api';

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

export interface RetentionCategory {
  category: string;
  retention: string;
  basis: string;
  erasable: boolean;
}

export interface RetentionPolicy {
  fiscalRetentionYears: number;
  categories: RetentionCategory[];
}

export async function fetchRetentionPolicy(): Promise<RetentionPolicy> {
  const res = await api.get('/privacy/retention');
  return unwrap<RetentionPolicy>(res.data);
}

export async function downloadCompanyDataExport(): Promise<void> {
  const res = await api.get('/privacy/export', { responseType: 'blob' });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(res.data as Blob, `domo-export-${stamp}.json`);
}

export async function anonymizeClient(
  clientId: string,
  reason?: string,
): Promise<{ message: string; alias: string }> {
  const res = await api.post(`/privacy/clients/${clientId}/anonymize`, { reason });
  return unwrap(res.data);
}

export async function downloadClientDataExport(
  clientId: string,
  clientName: string,
): Promise<void> {
  const res = await api.get(`/privacy/clients/${clientId}/export`);
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
  const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadBlob(blob, `datos-${slug}.json`);
}

export async function deleteCompanyData(
  confirmation: string,
  reason?: string,
): Promise<{ message: string; anonymizedUsers: number }> {
  const res = await api.delete('/privacy/company', { data: { confirmation, reason } });
  return unwrap(res.data);
}
