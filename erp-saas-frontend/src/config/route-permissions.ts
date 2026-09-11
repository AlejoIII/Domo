/**
 * Permiso mínimo de lectura por prefijo de ruta (primer segmento significativo).
 * null = cualquier usuario autenticado.
 */
export function getRoutePermission(pathname: string): string | null {
  const path = pathname.replace(/^\/+/, '').split('?')[0] ?? '';

  if (!path || path === 'dashboard') return null;
  if (path === 'settings' || path === 'onboarding' || path === 'plan-limit') return null;

  // Print views inherit document permissions
  if (path.includes('/print')) {
    if (path.startsWith('invoices/')) return 'invoices.read';
    if (path.startsWith('quotes/')) return 'quotes.read';
    if (path.startsWith('orders/')) return 'orders.read';
    if (path.startsWith('purchase-orders/')) return 'suppliers.read';
  }

  if (path.startsWith('hr/employees')) return 'employees.read';

  if (path.startsWith('crm/settings')) return 'crm.write';
  if (path.startsWith('crm')) return 'crm.read';

  if (path.startsWith('reports/sales') || path.startsWith('reports/finance')) {
    return 'reports.read';
  }
  if (path.startsWith('reports/stock-valuation')) return 'reports.read';

  if (path.startsWith('inventory/movements')) return 'products.read';
  if (path.startsWith('purchase-orders')) return 'suppliers.read';

  if (path.startsWith('accounting')) return 'accounting.read';
  if (path.startsWith('treasury')) return 'treasury.read';
  if (path.startsWith('projects')) return 'projects.read';
  if (path.startsWith('manufacturing')) return 'manufacturing.read';

  const root = path.split('/')[0];
  const map: Record<string, string> = {
    clients: 'clients.read',
    products: 'products.read',
    suppliers: 'suppliers.read',
    categories: 'products.read',
    warehouses: 'products.read',
    orders: 'orders.read',
    invoices: 'invoices.read',
    quotes: 'quotes.read',
  };

  return map[root] ?? null;
}

export function getWritePermission(readPermission: string): string {
  const [module] = readPermission.split('.');
  return `${module}.write`;
}
