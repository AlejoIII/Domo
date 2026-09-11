import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchBox } from '@/components/ui/SearchBox';
import { SelectFilter } from '@/components/ui/SelectFilter';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { TableImagePreview } from '@/components/ui/TableImagePreview';
import { ListFilterBar } from '@/components/list/ListFilterBar';
import { fetchProducts, deleteProduct } from '@/services/products.service';
import { fetchCategories } from '@/services/categories.service';
import { getEntity } from '@/config/entities.config';
import { usePreferencesStore } from '@/store/preferences.store';
import { formatMoney } from '@/lib/format';
import { useListFilters } from '@/hooks/useListFilters';

const FILTER_DEFAULTS = {
  search: '',
  category: '',
  active: '',
  lowStock: '',
};

const FILTER_KEYS = ['search', 'category', 'active', 'lowStock'] as const;

function isLowStock(product: { stock: number; minStock: number }) {
  return product.minStock > 0 && product.stock <= product.minStock;
}

export function ProductsPage() {
  const entity = getEntity('products');
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
  } = useListFilters('filters:products', FILTER_DEFAULTS, {
    mode: 'immediate',
    filterKeys: [...FILTER_KEYS],
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'filter'],
    queryFn: () => fetchCategories({ page: 1, limit: 100 }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, pageSize, applied],
    queryFn: () => fetchProducts({
      page,
      limit: pageSize,
      search: applied.search || undefined,
      category: applied.category || undefined,
      active: applied.active || undefined,
      lowStock: applied.lowStock === '1' || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
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
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="h-4 w-4" />
          Nuevo {entity.singular.toLowerCase()}
        </Button>
      </div>

      <Card className="p-4">
        <ListFilterBar onReset={resetFilters} showReset={hasActiveFilters}>
          <SearchBox
            value={applied.search}
            onChange={(v) => setFilter('search', v)}
            placeholder="Buscar por código, nombre, categoría o barras..."
            className="max-w-md flex-1"
          />
          <SelectFilter
            label="Categoría"
            value={applied.category}
            onChange={(v) => setFilter('category', v)}
            options={(categoriesData?.items ?? []).map((c) => ({ value: c.name, label: c.name }))}
            className="w-full sm:w-44"
          />
          <SelectFilter
            label="Estado"
            value={applied.active}
            onChange={(v) => setFilter('active', v)}
            options={[
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            className="w-full sm:w-40"
          />
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={applied.lowStock === '1'}
              onChange={(e) => setFilter('lowStock', e.target.checked ? '1' : '')}
              className="rounded border-border"
            />
            Solo stock bajo
          </label>
        </ListFilterBar>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-600">
            Error al cargar. Ejecuta: <code className="text-xs">npx prisma migrate dev</code>
          </p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            No hay {entity.plural.toLowerCase()}.{' '}
            <Link to="/products/new" className="text-primary hover:underline">Crear el primero</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium w-20"></th>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr
                    key={product.id}
                    className="cursor-pointer border-b border-border/40 hover:bg-muted/20"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {product.imageUrl ? (
                        <TableImagePreview
                          src={product.imageUrl}
                          alt={product.name}
                          title={product.name}
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{product.code}</td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{product.category ?? '—'}</td>
                    <td className="px-4 py-3">{formatMoney(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={isLowStock(product) ? 'font-medium text-amber-700 dark:text-amber-400' : ''}>
                        {product.stock} {product.unit}
                      </span>
                      {isLowStock(product) && (
                        <span className="ml-2">
                          <Badge variant={product.stock === 0 ? 'danger' : 'default'}>
                            Bajo
                          </Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.isActive ? 'success' : 'muted'}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="rounded p-2 hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar ${product.name}?`)) return;
                            await deleteMutation.mutateAsync(product.id);
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
