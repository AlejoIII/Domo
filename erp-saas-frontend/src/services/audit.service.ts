import { api } from './api';

export interface AuditLogEntry {
  id: string;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  createdAt: string;
  user?: { id: string; email: string; firstName?: string | null; lastName?: string | null } | null;
}

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchAuditLogs(params: { page?: number; limit?: number }) {
  const res = await api.get('/audit-logs', { params });
  return unwrap<{
    items: AuditLogEntry[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(res.data);
}
