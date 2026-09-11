import { extname } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_PATH_RE = /^\/uploads\/([^/]+)$/;

export function buildUploadPath(key: string) {
  return `/uploads/${key}`;
}

export function parseUploadPath(urlOrPath: string): string | null {
  const match = UPLOAD_PATH_RE.exec(urlOrPath.trim());
  return match?.[1] ?? null;
}

export function generateStorageKey(originalName: string) {
  return `${randomUUID()}${extname(originalName).toLowerCase()}`;
}
