import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchBox } from '@/components/ui/SearchBox';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ListFilterBar } from '@/components/list/ListFilterBar';
import { fetchClients, deleteClient } from '@/services/clients.service';
import { getEntity } from '@/config/entities.config';
import { usePreferencesStore } from '@/store/preferences.store';
import { useListFilters } from '@/hooks/useListFilters';
import { formatMoney } from '@/lib/format';
import { clientSegmentBadgeVariant, clientSegmentLabel } from '@/lib/clientSegment';

const FILTER_DEFAULTS = {
  search: '',
  segment: '',
  city: '',
  sortBy: 'createdAt',
};

const FILTER_KEYS = ['search', 'segment', 'city', 'sortBy'] as const;

export function ClientsPage() {
  const entity = getEntity('clients');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageSize = usePreferencesStore((s) => s.pageSize);

  const {
    draft,
    applied,
    setFilter,
    applyFilters,
    page,
    setPage,
    resetFilters,
    hasActiveFilters,
  } = useListFilters('filters:clients', FILTER_DEFAULTS, {
    mode: 'manual',
    filterKeys: [...FILTER_KEYS],
  });

  const sortBy = (applied.sortBy || 'createdAt') as 'createdAt' | 'name' | 'billing';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients', page, pageSize, applied],
    queryFn: () =>
      fetchClients({
        page,
        limit: pageSize,
        search: applied.search || undefined,
        segment: applied.segment || undefined,
        city: applied.city || undefined,
        sortBy,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{entity.plural}</h1>
          <p className="text-sm text-muted-foreground">CRM ligero · segmentos y facturación</p>
        </div>
        <Button onClick={() => navigate('/clients/new')}>
          <Plus className="h-4 w-4" />
          Nuevo {entity.singular.toLowerCase()}
        </Button>
      </div>

      <Card className="p-4">
        <ListFilterBar onReset={resetFilters} showReset={hasActiveFilters}>
          <div className="min-w-[240px] flex-1 space-y-1">
            <label className="text-sm font-medium">Buscar</label>
            <SearchBox
              value={draft.search}
              onChange={(v) => setFilter('search', v)}
              placeholder="Nombre, email, NIF..."
            />
          </div>
          <div className="w-full min-w-[140px] space-y-1 sm:w-auto">
            <label className="text-sm font-medium">Segmento</label>
            <select
              className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              value={draft.segment}
              onChange={(e) => setFilter('segment', e.target.value)}
            >
              <option value="">Todos</option>
              <option value="lead">Lead</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <Input
            label="Ciudad"
            value={draft.city}
            onChange={(e) => setFilter('city', e.target.value)}
            placeholder="Madrid"
            className="w-full sm:w-40"
          />
          <div className="w-full min-w-[160px] space-y-1 sm:w-auto">
            <label className="text-sm font-medium">Ordenar por</label>
            <select
              className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              value={draft.sortBy}
              onChange={(e) => setFilter('sortBy', e.target.value)}
            >
              <option value="createdAt">Más recientes</option>
              <option value="name">Nombre</option>
              <option value="billing">Facturación</option>
            </select>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => applyFilters()}>
            Aplicar
          </Button>
        </ListFilterBar>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-600">Error al cargar clientes.</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            No hay {entity.plural.toLowerCase()}.{' '}
            <Link to="/clients/new" className="text-primary hover:underline">Crear el primero</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Segmento</th>
                  <th className="px-4 py-3 font-medium">Ciudad</th>
                  <th className="px-4 py-3 font-medium text-right">Facturado</th>
                  <th className="px-4 py-3 font-medium text-right">Pendiente</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((client) => (
                  <tr
                    key={client.id}
                    className="cursor-pointer border-b border-border/40 hover:bg-muted/20"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={clientSegmentBadgeVariant(client.segment)}>
                        {clientSegmentLabel(client.segment)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.city ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(client.totalBilled ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(client.outstanding ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={client.isActive ? 'success' : 'muted'}>
                        {client.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="rounded p-2 hover:bg-muted"
                          title="Ver ficha"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar a ${client.name}?`)) return;
                            await deleteMutation.mutateAsync(client.id);
                          }}
                          className="rounded p-2 text-red-600 hover:bg-red-500/10"
                          title="Eliminar"
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
