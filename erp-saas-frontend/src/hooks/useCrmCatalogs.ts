import { useQueries } from '@tanstack/react-query';
import { fetchCrmCatalog } from '@/services/crm-config.service';
import type { CrmCatalogCategory, CrmCatalogItem } from '@/types/crm-config.types';

const CRM_OPERATIONAL_CATALOGS: CrmCatalogCategory[] = [
  'status',
  'task_type',
  'subject',
  'task_situation',
  'agenda_classification',
];

export function useCrmCatalogs() {
  const results = useQueries({
    queries: CRM_OPERATIONAL_CATALOGS.map((category) => ({
      queryKey: ['crm-catalog', category],
      queryFn: () => fetchCrmCatalog(category),
      staleTime: 60_000,
    })),
  });

  const byCategory = CRM_OPERATIONAL_CATALOGS.reduce(
    (acc, category, index) => {
      acc[category] = results[index].data ?? [];
      return acc;
    },
    {} as Record<CrmCatalogCategory, CrmCatalogItem[]>,
  );

  const isLoading = results.some((r) => r.isLoading);

  return {
    isLoading,
    statuses: byCategory.status,
    taskTypes: byCategory.task_type,
    subjects: byCategory.subject,
    taskSituations: byCategory.task_situation,
    agendaClassifications: byCategory.agenda_classification,
  };
}

export function catalogLabel(
  item: { name: string; code?: string | null } | null | undefined,
  fallbackCode?: string,
  items: CrmCatalogItem[] = [],
) {
  if (item?.name) return item.name;
  if (fallbackCode) {
    return items.find((i) => i.code === fallbackCode)?.name ?? fallbackCode;
  }
  return '—';
}
