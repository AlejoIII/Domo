import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Truck,
  Warehouse,
  Tags,
  BarChart3,
  Wallet,
  Calculator,
  Landmark,
  Kanban,
  Settings2,
  FolderKanban,
  Factory,
  UserCircle,
  ClipboardList,
  ArrowLeftRight,
  Layers,
} from 'lucide-react';
import type { MenuItem } from '@/types/menu.types';

/** Añade nuevas entradas o subopciones aquí — el sidebar las renderiza automáticamente */
export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'sales',
    label: 'Ventas',
    icon: ShoppingCart,
    children: [
      { id: 'clients', label: 'Clientes', to: '/clients', icon: Users, permission: 'clients.read' },
      { id: 'orders', label: 'Pedidos', to: '/orders', icon: ClipboardList, permission: 'orders.read' },
      { id: 'invoices', label: 'Facturas', to: '/invoices', icon: FileText, permission: 'invoices.read' },
      { id: 'quotes', label: 'Presupuestos', to: '/quotes', icon: FileText, permission: 'quotes.read' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: Package,
    children: [
      { id: 'products', label: 'Productos', to: '/products', icon: Package, permission: 'products.read' },
      { id: 'categories', label: 'Categorías', to: '/categories', icon: Tags, permission: 'products.read' },
      { id: 'warehouses', label: 'Almacenes', to: '/warehouses', icon: Warehouse, permission: 'products.read' },
      { id: 'stock-movements', label: 'Movimientos', to: '/inventory/movements', icon: ArrowLeftRight, permission: 'products.read' },
    ],
  },
  {
    id: 'purchases',
    label: 'Compras',
    icon: Truck,
    children: [
      { id: 'suppliers', label: 'Proveedores', to: '/suppliers', icon: Truck, permission: 'suppliers.read' },
      { id: 'purchase-orders', label: 'Órdenes de compra', to: '/purchase-orders', icon: ClipboardList, permission: 'suppliers.read' },
    ],
  },
  {
    id: 'reports',
    label: 'Informes',
    icon: BarChart3,
    planFeature: 'reports',
    children: [
      { id: 'sales-report', label: 'Ventas', to: '/reports/sales', icon: BarChart3, permission: 'reports.read' },
      { id: 'finance-report', label: 'Finanzas', to: '/reports/finance', icon: Wallet, permission: 'reports.read' },
      { id: 'stock-valuation', label: 'Valoración stock', to: '/reports/stock-valuation', icon: Layers, permission: 'reports.read' },
    ],
  },
  {
    id: 'accounting',
    label: 'Contabilidad',
    icon: Calculator,
    planFeature: 'accounting',
    children: [
      {
        id: 'accounting-main',
        label: 'Contabilidad',
        to: '/accounting',
        icon: Calculator,
        permission: 'accounting.read',
      },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Kanban,
    planFeature: 'crm',
    children: [
      {
        id: 'crm-main',
        label: 'Pipeline',
        to: '/crm',
        icon: Kanban,
        permission: 'crm.read',
      },
      {
        id: 'crm-settings',
        label: 'Configuración',
        to: '/crm/settings',
        icon: Settings2,
        permission: 'crm.write',
      },
    ],
  },
  {
    id: 'treasury',
    label: 'Tesorería',
    icon: Landmark,
    planFeature: 'treasury',
    children: [
      {
        id: 'treasury-main',
        label: 'Tesorería',
        to: '/treasury',
        icon: Landmark,
        permission: 'treasury.read',
      },
    ],
  },
  {
    id: 'projects',
    label: 'Proyectos',
    icon: FolderKanban,
    planFeature: 'projects',
    children: [
      {
        id: 'projects-main',
        label: 'Proyectos',
        to: '/projects',
        icon: FolderKanban,
        permission: 'projects.read',
      },
    ],
  },
  {
    id: 'manufacturing',
    label: 'Fabricación',
    icon: Factory,
    planFeature: 'manufacturing',
    children: [
      {
        id: 'manufacturing-main',
        label: 'Fabricación',
        to: '/manufacturing',
        icon: Factory,
        permission: 'manufacturing.read',
      },
    ],
  },
  {
    id: 'hr',
    label: 'RRHH',
    icon: UserCircle,
    planFeature: 'hr',
    children: [
      { id: 'employees', label: 'Empleados', to: '/hr/employees', icon: UserCircle, permission: 'employees.read' },
    ],
  },
];

/** Rutas planas derivadas del menú — útil para registrar en el router */
export function getMenuRoutes(): { path: string; title: string }[] {
  const routes: { path: string; title: string }[] = [];

  for (const item of menuItems) {
    if ('to' in item) {
      routes.push({ path: item.to, title: item.label });
    } else {
      for (const child of item.children) {
        routes.push({ path: child.to, title: child.label });
      }
    }
  }

  return routes;
}
