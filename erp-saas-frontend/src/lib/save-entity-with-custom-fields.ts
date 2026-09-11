import { useQueryClient } from '@tanstack/react-query';
import type { ConfigurableEntityId } from '@/config/field-definitions';
import { persistCustomFieldsAfterSave } from '@/services/custom-fields.service';

export async function saveEntityWithCustomFields<T extends { id: string }>({
  entityId,
  isNew,
  recordId,
  payload,
  customFields,
  create,
  update,
  queryClient,
  listQueryKey,
  navigate,
}: {
  entityId: ConfigurableEntityId;
  isNew: boolean;
  recordId?: string;
  payload: unknown;
  customFields: Record<string, unknown>;
  create: (payload: never) => Promise<T>;
  update: (id: string, payload: never) => Promise<T>;
  queryClient: ReturnType<typeof useQueryClient>;
  listQueryKey: string[];
  navigate: () => void;
}) {
  const saved = isNew
    ? await create(payload as never)
    : await update(recordId!, payload as never);
  await persistCustomFieldsAfterSave(entityId, saved.id, customFields);
  queryClient.invalidateQueries({ queryKey: listQueryKey });
  queryClient.invalidateQueries({ queryKey: ['custom-fields', entityId, saved.id] });
  navigate();
}
