import { api } from './api';
import type {
  DataImportKind,
  DataImportResult,
  DataImportTemplate,
  ImportCsvPayload,
  ImportProductsPayload,
} from '@/types/data-import.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchDataImportTemplate(kind: DataImportKind): Promise<DataImportTemplate> {
  const res = await api.get(`/data-import/templates/${kind}`);
  return unwrap<DataImportTemplate>(res.data);
}

export async function importWarehousesCsv(payload: ImportCsvPayload): Promise<DataImportResult> {
  const res = await api.post('/data-import/warehouses', payload);
  return unwrap<DataImportResult>(res.data);
}

export async function importClientsCsv(payload: ImportCsvPayload): Promise<DataImportResult> {
  const res = await api.post('/data-import/clients', payload);
  return unwrap<DataImportResult>(res.data);
}

export async function importProductsCsv(payload: ImportProductsPayload): Promise<DataImportResult> {
  const res = await api.post('/data-import/products', payload);
  return unwrap<DataImportResult>(res.data);
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
