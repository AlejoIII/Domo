import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchBox } from '@/components/ui/SearchBox';
import { Loader } from '@/components/ui/Loader';
import { fetchWarehouses, deleteWarehouse } from '@/services/warehouses.service';
import { getEntity } from '@/config/entities.config';
import { usePreferencesStore } from '@/store/preferences.store';

export function WarehousesPage() {
  const entity = getEntity('warehouses');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = usePreferencesStore((s) => s.pageSize);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['warehouses', page, pageSize, search],
    queryFn: () => fetchWarehouses({ page, limit: pageSize, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
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
        <Button onClick={() => navigate('/warehouses/new')}>
          <Plus className="h-4 w-4" />
          Nuevo {entity.singular.toLowerCase()}
        </Button>
      </div>

      <Card className="p-4">
        <SearchBox
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Buscar por código, nombre o ciudad..."
          className="max-w-md"
        />
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-600">Error al cargar almacenes.</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            No hay {entity.plural.toLowerCase()}.{' '}
            <Link to="/warehouses/new" className="text-primary hover:underline">Crear el primero</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Ciudad</th>
                  <th className="px-4 py-3 font-medium">Dirección</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((warehouse) => (
                  <tr
                    key={warehouse.id}
                    className="cursor-pointer border-b border-border/40 hover:bg-muted/20"
                    onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{warehouse.code}</td>
                    <td className="px-4 py-3 font-medium">{warehouse.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{warehouse.city ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{warehouse.address ?? '—'}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                          className="rounded p-2 hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar ${warehouse.name}?`)) return;
                            await deleteMutation.mutateAsync(warehouse.id);
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
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
