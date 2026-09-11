/** Etiquetas en español para el catálogo de permisos (códigos técnicos en inglés). */

/** Plantilla empleado raso (alineada con backend EMPLOYEE_DEFAULT_PERMISSIONS). */
export const EMPLOYEE_DEFAULT_PERMISSION_NAMES = [
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
] as const;

/** Permisos de alto impacto: avisar al otorgarlos. */
export const SENSITIVE_PERMISSION_NAMES = [
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
] as const;

export function isSensitivePermission(name: string): boolean {
  return (SENSITIVE_PERMISSION_NAMES as readonly string[]).includes(name);
}

const GROUP_LABELS: Record<string, string> = {
  users: 'Usuarios',
  clients: 'Clientes',
  products: 'Productos e inventario',
  orders: 'Pedidos',
  invoices: 'Facturas',
  quotes: 'Presupuestos',
  suppliers: 'Compras y proveedores',
  employees: 'Recursos humanos',
  settings: 'Configuración',
  api: 'Integraciones',
  reports: 'Informes',
  accounting: 'Contabilidad',
  crm: 'CRM',
  treasury: 'Tesorería',
  projects: 'Proyectos',
  manufacturing: 'Fabricación',
};

const ACTION_LABELS: Record<string, string> = {
  read: 'Ver y consultar',
  write: 'Crear y editar',
  billing: 'Plan y facturación',
  manage: 'Gestionar API y webhooks',
};

/** Descripción completa del permiso (lo que ve el cliente al otorgarlo). */
const PERMISSION_LABELS: Record<string, string> = {
  'users.read': 'Ver usuarios de la empresa',
  'users.write': 'Invitar y cambiar roles de usuarios',
  'clients.read': 'Ver clientes y sus fichas',
  'clients.write': 'Crear y editar clientes (incluye anonimización RGPD)',
  'products.read': 'Ver productos, categorías, almacenes y stock',
  'products.write': 'Crear y editar productos, categorías, almacenes y movimientos',
  'orders.read': 'Ver pedidos de venta',
  'orders.write': 'Crear y editar pedidos de venta',
  'invoices.read': 'Ver facturas y rectificativas',
  'invoices.write': 'Crear y editar facturas, cobros y rectificativas',
  'quotes.read': 'Ver presupuestos',
  'quotes.write': 'Crear y editar presupuestos',
  'suppliers.read': 'Ver proveedores y órdenes de compra',
  'suppliers.write': 'Crear y editar proveedores y órdenes de compra',
  'employees.read': 'Ver empleados',
  'employees.write': 'Crear y editar empleados',
  'settings.read': 'Ver preferencias de la aplicación',
  'settings.write': 'Cambiar configuración de la empresa',
  'settings.billing': 'Gestionar plan y facturación',
  'api.manage': 'Gestionar claves API y webhooks',
  'reports.read': 'Ver informes de ventas, finanzas y stock',
  'accounting.read': 'Ver contabilidad y asientos',
  'accounting.write': 'Crear y editar asientos contables',
  'crm.read': 'Ver CRM (oportunidades, contactos, pipeline)',
  'crm.write': 'Crear y editar CRM',
  'treasury.read': 'Ver tesorería y cuentas bancarias',
  'treasury.write': 'Crear y editar movimientos de tesorería',
  'projects.read': 'Ver proyectos y tareas',
  'projects.write': 'Crear y editar proyectos y tareas',
  'manufacturing.read': 'Ver órdenes de fabricación',
  'manufacturing.write': 'Crear y editar fabricación',
};

function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPermissionGroup(group: string): string {
  return GROUP_LABELS[group] ?? titleCase(group);
}

export function formatPermissionLabel(name: string): string {
  if (PERMISSION_LABELS[name]) return PERMISSION_LABELS[name];

  const [group, action, ...rest] = name.split('.');
  if (!group || !action) return name;

  const groupLabel = formatPermissionGroup(group);
  const actionKey = rest.length ? `${action}.${rest.join('.')}` : action;
  const actionLabel =
    ACTION_LABELS[actionKey] ??
    ACTION_LABELS[action] ??
    titleCase([action, ...rest].join(' '));

  return `${groupLabel}: ${actionLabel.toLowerCase()}`;
}
