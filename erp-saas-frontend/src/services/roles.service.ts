import { api } from './api';
import type { Permission, Role, RolePayload } from '@/types/role.types';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchRoles(): Promise<Role[]> {
  const res = await api.get('/roles');
  return unwrap<Role[]>(res.data);
}

export async function fetchPermissions(): Promise<Permission[]> {
  const res = await api.get('/roles/permissions/all');
  return unwrap<Permission[]>(res.data);
}

export async function createRole(payload: RolePayload): Promise<Role> {
  const res = await api.post('/roles', payload);
  return unwrap<Role>(res.data);
}

export async function updateRole(id: string, payload: RolePayload): Promise<Role> {
  const res = await api.patch(`/roles/${id}`, payload);
  return unwrap<Role>(res.data);
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}
