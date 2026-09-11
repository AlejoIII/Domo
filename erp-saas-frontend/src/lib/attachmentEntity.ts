export const ATTACHMENT_ENTITY_TYPES = [
  'client',
  'invoice',
  'order',
  'quote',
  'purchase_order',
  'product',
  'supplier',
] as const;

export type AttachmentEntityType = (typeof ATTACHMENT_ENTITY_TYPES)[number];

const ENTITY_PERMISSION_MODULE: Record<AttachmentEntityType, string> = {
  client: 'clients',
  invoice: 'invoices',
  order: 'orders',
  quote: 'quotes',
  purchase_order: 'suppliers',
  product: 'products',
  supplier: 'suppliers',
};

export function attachmentReadPermission(entityType: AttachmentEntityType): string {
  return `${ENTITY_PERMISSION_MODULE[entityType]}.read`;
}

export function attachmentWritePermission(entityType: AttachmentEntityType): string {
  return `${ENTITY_PERMISSION_MODULE[entityType]}.write`;
}

export const ATTACHMENT_ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv';

export const DEFAULT_MAX_UPLOAD_MB = 10;

export function isImageAttachment(mimeType?: string | null, fileName?: string): boolean {
  const mime = mimeType?.toLowerCase() ?? '';
  if (mime.startsWith('image/')) return true;
  if (mime === 'application/octet-stream' && /\.(jpe?g|png|webp|gif)$/i.test(fileName ?? '')) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(fileName ?? '');
}
