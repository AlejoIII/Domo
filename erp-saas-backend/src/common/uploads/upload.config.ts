import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export function getMaxUploadBytes(): number {
  const mb = Number.parseInt(process.env.MAX_UPLOAD_MB ?? '10', 10);
  const safeMb = Number.isFinite(mb) && mb > 0 ? mb : 10;
  return safeMb * 1024 * 1024;
}

export function getMaxUploadMb(): number {
  return Math.round(getMaxUploadBytes() / (1024 * 1024));
}

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/pjpeg',
  'image/x-png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const ALLOWED_EXT = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.csv',
]);

type UploadFileMeta = Pick<Express.Multer.File, 'mimetype' | 'originalname'>;

export function isAllowedAttachmentFile(file: UploadFileMeta): boolean {
  return isAllowedAttachmentMeta(file.mimetype, file.originalname);
}

export function isAllowedAttachmentMeta(
  mimeType?: string | null,
  fileName?: string | null,
): boolean {
  const mime = mimeType?.toLowerCase() ?? '';
  if (mime && ALLOWED_MIME.has(mime)) return true;
  if (fileName && ALLOWED_EXT.has(extname(fileName).toLowerCase())) return true;
  return false;
}

export function assertAllowedAttachmentMeta(
  mimeType?: string | null,
  size?: number | null,
  fileName?: string | null,
) {
  if (size != null && size > getMaxUploadBytes()) {
    throw new BadRequestException(`El archivo supera el límite de ${getMaxUploadMb()} MB`);
  }
  if (!mimeType && !fileName) return;
  if (!isAllowedAttachmentMeta(mimeType, fileName)) {
    throw new BadRequestException('Tipo de archivo no permitido');
  }
}
