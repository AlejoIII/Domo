import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNavigationSettings, updateNavigationSettings } from '@/services/settings.service';
import { useAuthReady } from '@/hooks/useAuthReady';

export function useNavigationPrefs() {
  const authReady = useAuthReady();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['settings', 'navigation'],
    queryFn: fetchNavigationSettings,
    enabled: authReady,
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['settings', 'navigation'] });
  };

  return {
    ...query,
    prefs: query.data?.prefs,
    planFeatures: query.data?.plan.features,
    planCode: query.data?.plan.code,
    planName: query.data?.plan.name,
    save: updateNavigationSettings,
    invalidate,
  };
}
