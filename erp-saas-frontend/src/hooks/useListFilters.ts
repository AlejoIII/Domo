import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  apiParamsFromFilters,
  filtersToParams,
  hasActiveFilters,
  hasUrlFilters,
  persistFilters,
  readFiltersFromParams,
  readFiltersFromStorage,
  type FilterValues,
} from '@/lib/listFilters';

type ListFiltersMode = 'immediate' | 'manual';

interface UseListFiltersOptions {
  mode?: ListFiltersMode;
  filterKeys: string[];
}

export function useListFilters(
  storageKey: string,
  defaults: FilterValues,
  options: UseListFiltersOptions,
) {
  const { mode = 'immediate', filterKeys } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const initial = useMemo(() => {
    const fromUrl = readFiltersFromParams(searchParams, filterKeys);
    const merged = { ...defaults, ...fromUrl };
    if (hasUrlFilters(searchParams, filterKeys)) return merged;
    return readFiltersFromStorage(storageKey, defaults);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- init once

  const initialPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [draft, setDraft] = useState<FilterValues>(initial);
  const [applied, setApplied] = useState<FilterValues>(initial);
  const [page, setPageState] = useState(initialPage);

  const sync = useCallback((filters: FilterValues, pageNum: number) => {
    persistFilters(storageKey, filters);
    setSearchParams(filtersToParams(filters, pageNum), { replace: true });
  }, [setSearchParams, storageKey]);

  const applyFilters = useCallback((next?: FilterValues) => {
    const f = next ?? draft;
    setDraft(f);
    setApplied(f);
    setPageState(1);
    sync(f, 1);
  }, [draft, sync]);

  const setFilter = useCallback((key: string, value: string) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (mode === 'immediate') {
        setApplied(next);
        setPageState(1);
        sync(next, 1);
      }
      return next;
    });
  }, [mode, sync]);

  const setPage = useCallback((pageNum: number) => {
    setPageState(pageNum);
    sync(applied, pageNum);
  }, [applied, sync]);

  const resetFilters = useCallback(() => {
    setDraft(defaults);
    setApplied(defaults);
    setPageState(1);
    sync(defaults, 1);
  }, [defaults, sync]);

  const active = hasActiveFilters(applied, defaults);

  return {
    draft,
    applied,
    setDraft,
    setFilter,
    applyFilters,
    page,
    setPage,
    resetFilters,
    hasActiveFilters: active,
    apiParams: apiParamsFromFilters(applied),
  };
}
