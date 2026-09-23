import { api } from './api';

export interface VerifactuSettings {
  enabled: boolean;
  mode: string;
  nif?: string | null;
  hasCertificate: boolean;
  certificateFingerprint?: string | null;
  secretsKeyConfigured: boolean;
  software: {
    name: string;
    id: string;
    version: string;
    nifProductor: string;
    numeroInstalacion: string;
  };
  chain: {
    recordCount: number;
    lastHuella: string | null;
    lastGeneratedAt: string | null;
    pendingRemits: number;
  };
}

export interface VerifactuRecordRow {
  id: string;
  invoiceId?: string | null;
  recordType: string;
  invoiceType?: string | null;
  numSerieFactura: string;
  fechaExpedicion: string;
  importeTotal: string | number;
  huella: string;
  sequenceNo: number;
  aeatStatus: string;
  aeatCsv?: string | null;
  aeatSentAt?: string | null;
  aeatError?: string | null;
  qrPayload?: string | null;
  createdAt: string;
}

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchVerifactuSettings(): Promise<VerifactuSettings> {
  const res = await api.get('/verifactu/settings');
  return unwrap<VerifactuSettings>(res.data);
}

export async function updateVerifactuSettings(payload: {
  enabled?: boolean;
  mode?: 'verifactu' | 'no_verificable';
  nif?: string;
  certificatePem?: string;
  certificatePassword?: string;
  clearCertificate?: boolean;
}): Promise<VerifactuSettings> {
  const res = await api.patch('/verifactu/settings', payload);
  return unwrap<VerifactuSettings>(res.data);
}

export async function fetchVerifactuRecords(take = 50): Promise<VerifactuRecordRow[]> {
  const res = await api.get('/verifactu/records', { params: { take } });
  return unwrap<VerifactuRecordRow[]>(res.data);
}

export async function retryVerifactuRecord(id: string): Promise<{ queued: boolean }> {
  const res = await api.post(`/verifactu/records/${id}/retry`);
  return unwrap<{ queued: boolean }>(res.data);
}
