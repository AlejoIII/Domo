export interface DashboardRecentOrder {
  id: string;
  number: string;
  status: string;
  total: number;
  orderDate?: string;
  client?: { id: string; name: string };
  createdAt?: string;
}

export interface DashboardLowStockProduct {
  id: string;
  code: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
}

export interface DashboardChartPoint {
  month: string;
  label: string;
  sales: number;
  collections: number;
}

export interface DashboardStats {
  revenue: number;
  outstandingReceivable?: number;
  overdueInvoicesCount?: number;
  overdueInvoicesAmount?: number;
  ordersToShip?: number;
  monthlySales?: number;
  monthlySalesTarget?: number | null;
  monthlySalesProgress?: number | null;
  clients: number;
  products: number;
  orders: number;
  lowStockCount?: number;
  lowStockProducts?: DashboardLowStockProduct[];
  recentOrders?: DashboardRecentOrder[];
  chart?: DashboardChartPoint[];
}
