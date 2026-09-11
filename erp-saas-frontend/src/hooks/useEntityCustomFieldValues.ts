import { useQuery } from '@tanstack/react-query';
import type { ConfigurableEntityId } from '@/config/field-definitions';
import { fetchCustomFieldValues } from '@/services/custom-fields.service';

export function useEntityCustomFieldValues(
  entityId: ConfigurableEntityId,
  entityRecordId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['custom-fields', entityId, entityRecordId],
    queryFn: () => fetchCustomFieldValues(entityId, entityRecordId!),
    enabled: enabled && !!entityRecordId,
    staleTime: 30_000,
  });
}
