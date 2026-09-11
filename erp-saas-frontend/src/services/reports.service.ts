import { api } from './api';
import type {
  ExportJobStatus,
  FinanceReport,
  ReportPeriodParams,
  SalesReport,
} from '@/types/report.types';

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

function filenameFromDisposition(header?: string, fallback = 'informe.csv') {
  if (!header) return fallback;
  const match = header.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollExportJob(jobId: string, maxAttempts = 60, intervalMs = 1500): Promise<ExportJobStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await api.get(`/reports/exports/${jobId}`);
    const status = unwrap<ExportJobStatus>(res.data);

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await sleep(intervalMs);
  }

  throw new Error('Tiempo de espera agotado al generar el informe. Inténtalo de nuevo.');
}

async function enqueueAndDownloadExport(
  exportPath: '/reports/sales/export' | '/reports/finance/export',
  params: ReportPeriodParams & { format: 'csv' | 'xlsx' },
  fallbackPrefix: 'ventas' | 'finanzas',
): Promise<void> {
  const enqueueRes = await api.get(exportPath, {
    params,
    validateStatus: (status) => status === 202 || status === 200,
  });

  let job = unwrap<ExportJobStatus>(enqueueRes.data);

  if (job.status !== 'completed' && job.status !== 'failed') {
    job = await pollExportJob(job.jobId);
  }

  if (job.status === 'failed') {
    throw new Error(job.error ?? 'No se pudo generar la exportación');
  }

  const downloadRes = await api.get(`/reports/exports/${job.jobId}/download`, {
    responseType: 'blob',
  });

  const ext = params.format === 'xlsx' ? 'xlsx' : 'csv';
  const fallback = `${fallbackPrefix}_${new Date().toISOString().slice(0, 10)}.${ext}`;
  const filename = job.fileName
    ?? filenameFromDisposition(downloadRes.headers['content-disposition'], fallback);

  downloadBlob(downloadRes.data, filename);
}

export async function fetchSalesReport(params?: ReportPeriodParams): Promise<SalesReport> {
  const res = await api.get('/reports/sales', { params });
  return unwrap<SalesReport>(res.data);
}

export async function fetchFinanceReport(params?: ReportPeriodParams): Promise<FinanceReport> {
  const res = await api.get('/reports/finance', { params });
  return unwrap<FinanceReport>(res.data);
}

export async function exportSalesReport(
  params: ReportPeriodParams & { format: 'csv' | 'xlsx' },
): Promise<void> {
  await enqueueAndDownloadExport('/reports/sales/export', params, 'ventas');
}

export async function exportFinanceReport(
  params: ReportPeriodParams & { format: 'csv' | 'xlsx' },
): Promise<void> {
  await enqueueAndDownloadExport('/reports/finance/export', params, 'finanzas');
}

export async function fetchExportStatus(jobId: string): Promise<ExportJobStatus> {
  const res = await api.get(`/reports/exports/${jobId}`);
  return unwrap<ExportJobStatus>(res.data);
}
