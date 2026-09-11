import { useQuery } from '@tanstack/react-query';
import {
  buildDefaultLayout,
  normalizeLayoutGrid,
  type ConfigurableEntityId,
} from '@/config/field-definitions';
import { fetchFormLayout } from '@/services/form-layout.service';

export function useFormLayout(entityId: ConfigurableEntityId) {
  const query = useQuery({
    queryKey: ['form-layout', entityId],
    queryFn: () => fetchFormLayout(entityId),
    staleTime: 60_000,
  });

  const rawConfig = query.data?.config ?? buildDefaultLayout(entityId);
  const config = normalizeLayoutGrid(rawConfig);

  return {
    config,
    isLoading: query.isLoading,
    isDefault: query.data?.isDefault ?? !query.data?.config,
    refetch: query.refetch,
  };
}
