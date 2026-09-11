const ENTITY_CODES: Record<string, string> = {
  clients: 'client',
  products: 'product',
  orders: 'order',
  invoices: 'invoice',
  quotes: 'quote',
  suppliers: 'supplier',
  employees: 'employee',
  categories: 'category',
  warehouses: 'warehouse',
  'purchase-orders': 'purchase_order',
  roles: 'role',
  settings: 'settings',
  integrations: 'integration',
  attachments: 'attachment',
  billing: 'billing',
  notifications: 'notifications',
};

export function buildAuditAction(method: string, path: string): string {
  const cleanPath = (path.split('?')[0] ?? path)
    .replace(/^\/api\/v\d+\//, '')
    .replace(/^\//, '');

  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length === 0) return `${method.toLowerCase()}.unknown`;

  const resource = segments[0]!;
  const entity = ENTITY_CODES[resource] ?? resource.replace(/-/g, '_');
  const verb = method.toUpperCase();

  if (verb === 'POST' && segments.length >= 3) {
    const sub = segments[segments.length - 1]!.replace(/-/g, '_');
    if (resource === 'platform') {
      return `platform.${sub}`;
    }
    return `${entity}.${sub}`;
  }

  if (['PATCH', 'PUT'].includes(verb) && segments.length >= 3) {
    const sub = segments[segments.length - 1]!.replace(/-/g, '_');
    if (resource === 'platform') {
      const section = segments[1]?.replace(/-/g, '_') ?? 'unknown';
      return `platform.${section}.${sub}`;
    }
    return `${entity}.${sub}`;
  }

  if (verb === 'DELETE' && segments.length >= 4 && segments[2] === 'notes') {
    return `${entity}.note.delete`;
  }

  if (verb === 'POST' && segments.length === 1) return `${entity}.create`;
  if (['PATCH', 'PUT'].includes(verb) && segments[1] === ':id') return `${entity}.update`;
  if (verb === 'DELETE' && segments[1] === ':id') return `${entity}.delete`;

  if (verb === 'POST' && segments[0] === 'settings') {
    if (segments[1] === 'change-password') return 'profile.password_change';
    if (segments[1] === 'invitations') return 'invitation.create';
  }

  if (verb === 'DELETE' && segments[0] === 'settings' && segments[1] === 'invitations') {
    return 'invitation.revoke';
  }

  return `${method.toLowerCase()}.${cleanPath.replace(/\//g, '.').replace(/:/g, '')}`;
}

export function extractAuditEntity(path: string): string | null {
  const cleanPath = (path.split('?')[0] ?? path)
    .replace(/^\/api\/v\d+\//, '')
    .replace(/^\//, '');
  const match = cleanPath.match(/^([^/]+)/);
  return match?.[1]?.replace(/-/g, '_') ?? null;
}
