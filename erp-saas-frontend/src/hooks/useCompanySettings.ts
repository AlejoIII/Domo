import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCompanySettings } from '@/services/settings.service';
import { useCompanyStore } from '@/store/company.store';
import { useAuthReady } from '@/hooks/useAuthReady';

export function useCompanySettings() {
  const authReady = useAuthReady();
  const applySettings = useCompanyStore((s) => s.applySettings);

  const query = useQuery({
    queryKey: ['settings', 'company'],
    queryFn: fetchCompanySettings,
    enabled: authReady,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) applySettings(query.data);
  }, [query.data, applySettings]);

  const { currency, defaultTaxRate } = useCompanyStore();

  return {
    ...query,
    currency,
    defaultTaxRate,
  };
}
