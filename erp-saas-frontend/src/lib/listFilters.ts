export type FilterValues = Record<string, string>;

export function readFiltersFromParams(
  params: URLSearchParams,
  keys: string[],
): FilterValues {
  const result: FilterValues = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value != null) result[key] = value;
  }
  return result;
}

export function hasUrlFilters(params: URLSearchParams, keys: string[]): boolean {
  return keys.some((key) => {
    const value = params.get(key);
    return value != null && value !== '';
  });
}

export function readFiltersFromStorage(
  storageKey: string,
  defaults: FilterValues,
): FilterValues {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as FilterValues;
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

export function persistFilters(storageKey: string, filters: FilterValues) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(filters));
  } catch {
    // ignore quota errors
  }
}

export function filtersToParams(filters: FilterValues, page?: number): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value?.trim()) params.set(key, value.trim());
  }
  if (page && page > 1) params.set('page', String(page));
  return params;
}

export function hasActiveFilters(filters: FilterValues, defaults: FilterValues): boolean {
  return Object.keys(defaults).some((key) => (filters[key] ?? '') !== (defaults[key] ?? ''));
}

export function apiParamsFromFilters(
  filters: FilterValues,
  map?: Record<string, string>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(filters)) {
    const apiKey = map?.[key] ?? key;
    out[apiKey] = value?.trim() ? value.trim() : undefined;
  }
  return out;
}
