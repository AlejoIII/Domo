import { api } from './api';
import type { ConfigurableEntityId } from '@/config/field-definitions';

function unwrap<T>(data: { data?: T } & T): T {
  return (data.data ?? data) as T;
}

export async function fetchCustomFieldValues(
  entityType: ConfigurableEntityId,
  entityId: string,
): Promise<Record<string, unknown>> {
  const res = await api.get(`/custom-fields/${entityType}/${entityId}`);
  const payload = unwrap<{ values: Record<string, unknown> }>(res.data);
  return payload.values ?? {};
}

export async function saveCustomFieldValues(
  entityType: ConfigurableEntityId,
  entityId: string,
  values: Record<string, unknown>,
): Promise<void> {
  await api.put(`/custom-fields/${entityType}/${entityId}`, { values });
}

export async function persistCustomFieldsAfterSave(
  entityType: ConfigurableEntityId,
  entityId: string,
  customFields: Record<string, unknown>,
) {
  if (Object.keys(customFields).length === 0) return;
  await saveCustomFieldValues(entityType, entityId, customFields);
}
