import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchBox } from '@/components/ui/SearchBox';
import { SelectFilter } from '@/components/ui/SelectFilter';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ListFilterBar } from '@/components/list/ListFilterBar';
import { fetchQuotes, deleteQuote } from '@/services/quotes.service';
import { getEntity } from '@/config/entities.config';
import { formatMoney, formatDate } from '@/lib/format';
import { QUOTE_STATUS_LABELS, statusBadgeVariant, statusLabel } from '@/lib/documentStatus';
import { usePreferencesStore } from '@/store/preferences.store';
import { useListFilters } from '@/hooks/useListFilters';

const FILTER_DEFAULTS = {
  search: '',
  status: '',
};

const FILTER_KEYS = ['search', 'status'] as const;

export function QuotesPage() {
  const entity = getEntity('quotes');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageSize = usePreferencesStore((s) => s.pageSize);

  const {
    applied,
    setFilter,
    page,
    setPage,
    resetFilters,
    hasActiveFilters,
  } = useListFilters('filters:quotes', FILTER_DEFAULTS, {
    mode: 'immediate',
    filterKeys: [...FILTER_KEYS],
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quotes', page, pageSize, applied],
    queryFn: () => fetchQuotes({
      page,
      limit: pageSize,
      search: applied.search || undefined,
      status: applied.status || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{entity.plural}</h1>
          <p className="text-sm text-muted-foreground">Rejilla de {entity.plural.toLowerCase()}</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus className="h-4 w-4" />
          Nuevo {entity.singular.toLowerCase()}
        </Button>
      </div>

      <Card className="p-4">
        <ListFilterBar onReset={resetFilters} showReset={hasActiveFilters}>
          <SearchBox
            value={applied.search}
            onChange={(v) => setFilter('search', v)}
            placeholder="Buscar por número o cliente..."
            className="max-w-md flex-1"
          />
          <SelectFilter
            label="Estado"
            value={applied.status}
            onChange={(v) => setFilter('status', v)}
            options={Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            className="w-full sm:w-44"
          />
        </ListFilterBar>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-600">Error al cargar presupuestos.</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            No hay {entity.plural.toLowerCase()}.{' '}
            <Link to="/quotes/new" className="text-primary hover:underline">Crear el primero</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Válido hasta</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((quote) => (
                  <tr
                    key={quote.id}
                    className="cursor-pointer border-b border-border/40 hover:bg-muted/20"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{quote.number}</td>
                    <td className="px-4 py-3 font-medium">{quote.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(quote.validUntil)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(quote.status)}>
                        {statusLabel(QUOTE_STATUS_LABELS, quote.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatMoney(quote.total)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/quotes/${quote.id}`)}
                          className="rounded p-2 hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar presupuesto ${quote.number}?`)) return;
                            await deleteMutation.mutateAsync(quote.id);
                          }}
                          className="rounded p-2 text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {meta.total} registros · Página {meta.page} de {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </Button>
              <Button variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
