import { api } from './api';

export type AlertSeverity = 'info' | 'warning' | 'danger';
export type AlertCategory = 'system' | 'invoices' | 'orders';

export interface AppAlert {
  id: string;
  type: 'low_stock' | 'invoice_overdue' | 'order_pending_ship';
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  link: string;
  createdAt: string;
}

export interface NotificationsResponse {
  alerts: AppAlert[];
  counts: {
    total: number;
    system: number;
    invoices: number;
    orders: number;
  };
}

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await api.get('/notifications');
  return unwrap<NotificationsResponse>(res.data);
}
