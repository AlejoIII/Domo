/** Catálogo completo de permisos (códigos técnicos). */
export const CATALOG_PERMISSIONS = [
  'users.read', 'users.write',
  'clients.read', 'clients.write',
  'products.read', 'products.write',
  'orders.read', 'orders.write',
  'invoices.read', 'invoices.write',
  'quotes.read', 'quotes.write',
  'suppliers.read', 'suppliers.write',
  'employees.read', 'employees.write',
  'settings.read', 'settings.write',
  'settings.billing',
  'api.manage',
  'reports.read',
  'accounting.read', 'accounting.write',
  'crm.read', 'crm.write',
  'treasury.read', 'treasury.write',
  'projects.read', 'projects.write',
  'manufacturing.read', 'manufacturing.write',
] as const;

export type CatalogPermission = (typeof CATALOG_PERMISSIONS)[number];

/**
 * Plantilla «empleado raso»: operativa diaria sin administración,
 * facturación del SaaS, API, RR.HH. ni finanzas sensibles.
 */
export const EMPLOYEE_DEFAULT_PERMISSIONS: readonly CatalogPermission[] = [
  'clients.read',
  'clients.write',
  'products.read',
  'products.write',
  'orders.read',
  'orders.write',
  'invoices.read',
  'invoices.write',
  'quotes.read',
  'quotes.write',
  'suppliers.read',
  'suppliers.write',
  'reports.read',
  'crm.read',
  'crm.write',
  'projects.read',
  'projects.write',
  'manufacturing.read',
  'manufacturing.write',
];

/** Permisos de alto impacto: el admin debe otorgarlos con cuidado. */
export const SENSITIVE_PERMISSIONS: readonly CatalogPermission[] = [
  'users.read',
  'users.write',
  'settings.read',
  'settings.write',
  'settings.billing',
  'api.manage',
  'employees.read',
  'employees.write',
  'accounting.read',
  'accounting.write',
  'treasury.read',
  'treasury.write',
];

export function isSensitivePermission(name: string): boolean {
  return (SENSITIVE_PERMISSIONS as readonly string[]).includes(name);
}
