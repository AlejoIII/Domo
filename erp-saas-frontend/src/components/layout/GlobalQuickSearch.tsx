import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigationPrefs } from '@/hooks/useNavigationPrefs';
import { applyNavigationPrefs } from '@/lib/navigation-utils';
import { menuItems } from '@/config/menu.config';
import {
  buildQuickSearchEntries,
  filterQuickSearchEntries,
  type QuickSearchEntry,
} from '@/lib/route-context';
import { cn } from '@/lib/cn';

function useAccessibleQuickSearchEntries(): QuickSearchEntry[] {
  const { permissions, roleName, roleId, isAdmin } = usePermissions();
  const { prefs, planFeatures } = useNavigationPrefs();

  const canAccess = useCallback(
    (permission?: string) => {
      if (!permission) return true;
      if (isAdmin) return true;
      if (!roleId) return true;
      if (!roleName && permissions.length === 0) return true;
      return permissions.includes(permission);
    },
    [permissions, roleName, roleId, isAdmin],
  );

  return useMemo(() => {
    const visiblePaths = new Set<string>();

    const visibleItems = applyNavigationPrefs(menuItems, prefs, planFeatures, canAccess);
    for (const item of visibleItems) {
      if ('to' in item) {
        visiblePaths.add(item.to);
      } else {
        for (const child of item.children) {
          visiblePaths.add(child.to);
        }
      }
    }

    return buildQuickSearchEntries().filter((entry) => {
      const path = entry.to.split('?')[0];
      if (entry.group === 'Configuración') return true;
      if (entry.group === 'Acciones rápidas') {
        return visiblePaths.has(path.replace(/\/new$/, ''));
      }
      return visiblePaths.has(path);
    });
  }, [canAccess, prefs, planFeatures]);
}

export function GlobalQuickSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const entries = useAccessibleQuickSearchEntries();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(
    () => filterQuickSearchEntries(entries, query),
    [entries, query],
  );

  const goTo = useCallback(
    (entry: QuickSearchEntry) => {
      navigate(entry.to);
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
    },
    [navigate],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-md', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
            return;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
          }
          if (event.key === 'Enter' && results[activeIndex]) {
            event.preventDefault();
            goTo(results[activeIndex]);
          }
        }}
        placeholder="Ir a módulo o acción…"
        className="h-9 w-full rounded-lg border border-border/70 bg-background/80 py-0 pl-9 pr-16 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        aria-label="Búsqueda rápida"
        aria-expanded={open}
        aria-controls="global-quick-search-results"
        role="combobox"
        autoComplete="off"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
        Ctrl K
      </kbd>

      {open && results.length > 0 && (
        <div
          id="global-quick-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-border/70 bg-card shadow-lg"
        >
          {results.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => goTo(entry)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition',
                index === activeIndex ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/60',
              )}
            >
              <span className="truncate font-medium">{entry.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{entry.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
