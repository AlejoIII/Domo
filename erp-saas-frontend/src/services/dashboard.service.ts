import { api } from './api';
import type { DashboardStats } from '@/types/dashboard.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await api.get('/dashboard/stats');
  return unwrap<DashboardStats>(res.data);
}
