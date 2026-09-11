import { api } from './api';
import type { FormLayoutConfig, FormLayoutResponse } from '@/types/form-layout.types';
import { sanitizeFormLayoutConfig } from '@/config/field-definitions';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchFormLayout(entityId: string): Promise<FormLayoutResponse> {
  const res = await api.get(`/settings/form-layouts/${entityId}`);
  return unwrap<FormLayoutResponse>(res.data);
}

export async function saveFormLayout(entityId: string, config: FormLayoutConfig) {
  const res = await api.patch(`/settings/form-layouts/${entityId}`, {
    config: sanitizeFormLayoutConfig(config),
  });
  return unwrap<FormLayoutResponse>(res.data);
}

export async function resetFormLayout(entityId: string) {
  const res = await api.delete(`/settings/form-layouts/${entityId}`);
  return unwrap(res.data);
}
