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

export const ATTACHMENT_ENTITY_PERMISSIONS: Record<
  AttachmentEntityType,
  { read: string; write: string }
> = {
  client: { read: 'clients.read', write: 'clients.write' },
  invoice: { read: 'invoices.read', write: 'invoices.write' },
  order: { read: 'orders.read', write: 'orders.write' },
  quote: { read: 'quotes.read', write: 'quotes.write' },
  purchase_order: { read: 'suppliers.read', write: 'suppliers.write' },
  product: { read: 'products.read', write: 'products.write' },
  supplier: { read: 'suppliers.read', write: 'suppliers.write' },
};

export type AttachmentAccessUser = {
  roleName?: string | null;
  permissions?: string[];
};

export function assertAttachmentPermission(
  user: AttachmentAccessUser | undefined,
  entityType: AttachmentEntityType,
  action: 'read' | 'write',
): void {
  if (!user) {
    throw new Error('No autorizado');
  }
  if (user.roleName?.toLowerCase() === 'admin') return;
  if (!user.permissions) return;
  if (user.permissions.length === 0 && !user.roleName) return;

  const required = ATTACHMENT_ENTITY_PERMISSIONS[entityType][action];
  if (!user.permissions.includes(required)) {
    throw new Error('No tienes permiso para esta acción');
  }
}
