import { api } from './api';
import axios from 'axios';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

function uploadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return 'No se pudo subir el archivo';
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post('/uploads/image', form);
  const payload = unwrap<{ url: string }>(res.data);
  return payload.url;
}

export async function uploadFile(file: File): Promise<{
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/uploads/file', form);
  return unwrap(res.data);
}

export async function fetchSignedUploadUrl(path: string): Promise<string> {
  const res = await api.get('/uploads/signed-url', { params: { path } });
  return unwrap<{ url: string }>(res.data).url;
}

export function needsSignedUploadUrl(url?: string | null): boolean {
  return !!url && url.startsWith('/uploads/');
}

export { uploadErrorMessage };

function apiOrigin(): string {
  const env = (import.meta as ImportMeta & { env?: { VITE_API_ORIGIN?: string } }).env;
  return env?.VITE_API_ORIGIN?.replace(/\/$/, '') ?? '';
}

/** Resuelve rutas /uploads/... al origen del API si hace falta (p. ej. frontend sin proxy). */
export function resolveUploadUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  if (url.startsWith('/uploads/')) {
    const origin = apiOrigin();
    return origin ? `${origin}${url}` : url;
  }
  return url;
}

export function resolveImageUrl(url?: string | null): string | undefined {
  return resolveUploadUrl(url);
}

/** URL de descarga autenticada (redirect a signed URL en S3). */
export function buildUploadDownloadUrl(path: string): string {
  const origin = apiOrigin();
  const base = origin || '';
  return `${base}/api/v1/uploads/download?path=${encodeURIComponent(path)}`;
}
