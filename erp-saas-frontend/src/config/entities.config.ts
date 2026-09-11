/** Registro central de entidades ERP (equivalente a RouteConfig de CloudTreyFact) */
export interface EntityConfig {
  id: string;
  table: string;
  singular: string;
  plural: string;
  basePath: string;
  menuGroup?: string;
}

export const entities: Record<string, EntityConfig> = {
  clients: {
    id: 'clients',
    table: 'clients',
    singular: 'Cliente',
    plural: 'Clientes',
    basePath: '/clients',
    menuGroup: 'sales',
  },
  products: {
    id: 'products',
    table: 'products',
    singular: 'Producto',
    plural: 'Productos',
    basePath: '/products',
    menuGroup: 'inventory',
  },
  categories: {
    id: 'categories',
    table: 'categories',
    singular: 'Categoría',
    plural: 'Categorías',
    basePath: '/categories',
    menuGroup: 'inventory',
  },
  warehouses: {
    id: 'warehouses',
    table: 'warehouses',
    singular: 'Almacén',
    plural: 'Almacenes',
    basePath: '/warehouses',
    menuGroup: 'inventory',
  },
  orders: {
    id: 'orders',
    table: 'orders',
    singular: 'Pedido',
    plural: 'Pedidos',
    basePath: '/orders',
    menuGroup: 'sales',
  },
  invoices: {
    id: 'invoices',
    table: 'invoices',
    singular: 'Factura',
    plural: 'Facturas',
    basePath: '/invoices',
    menuGroup: 'sales',
  },
  quotes: {
    id: 'quotes',
    table: 'quotes',
    singular: 'Presupuesto',
    plural: 'Presupuestos',
    basePath: '/quotes',
    menuGroup: 'sales',
  },
  suppliers: {
    id: 'suppliers',
    table: 'suppliers',
    singular: 'Proveedor',
    plural: 'Proveedores',
    basePath: '/suppliers',
    menuGroup: 'purchases',
  },
  purchaseOrders: {
    id: 'purchaseOrders',
    table: 'purchase_orders',
    singular: 'Orden de compra',
    plural: 'Órdenes de compra',
    basePath: '/purchase-orders',
    menuGroup: 'purchases',
  },
  employees: {
    id: 'employees',
    table: 'employees',
    singular: 'Empleado',
    plural: 'Empleados',
    basePath: '/hr/employees',
    menuGroup: 'hr',
  },
};

export function getEntity(id: keyof typeof entities): EntityConfig {
  return entities[id];
}
