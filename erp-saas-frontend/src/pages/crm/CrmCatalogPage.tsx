import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { SearchBox } from '@/components/ui/SearchBox';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useInlineFormGuard } from '@/hooks/useInlineFormGuard';
import {
  CRM_CATALOG_LABELS,
  CRM_CATALOG_NAME_EXAMPLES,
  getCatalogMeta,
} from '@/config/crm-settings.config';
import {
  createCrmCatalogItem,
  deleteCrmCatalogItem,
  fetchCrmCatalog,
  updateCrmCatalogItem,
} from '@/services/crm-config.service';
import type { CrmCatalogCategory, CrmCatalogItem } from '@/types/crm-config.types';

const VALID_CATEGORIES = Object.keys(CRM_CATALOG_LABELS) as CrmCatalogCategory[];

function isValidCategory(value: string | undefined): value is CrmCatalogCategory {
  return !!value && VALID_CATEGORIES.includes(value as CrmCatalogCategory);
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
  color: '#6366f1',
  sortOrder: '0',
  isActive: true,
};

export function CrmCatalogPage() {
  const { category: categoryParam } = useParams();
  const queryClient = useQueryClient();
  const category = isValidCategory(categoryParam) ? categoryParam : 'subject';
  const meta = getCatalogMeta(category);
  const title = CRM_CATALOG_LABELS[category];

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CrmCatalogItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const { markClean, guardedClose, dialog } = useInlineFormGuard(
    showForm,
    form,
    editing?.id ?? 'new',
    closeForm,
  );

  const queryKey = ['crm-catalog', category, search];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchCrmCatalog(category, search || undefined),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        color: form.color.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        return updateCrmCatalogItem(category, editing.id, payload);
      }
      return createCrmCatalogItem(category, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-catalog', category] });
      markClean();
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCrmCatalogItem(category, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-catalog', category] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: CrmCatalogItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code ?? '',
      description: item.description ?? '',
      color: item.color ?? '#6366f1',
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/crm/settings"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Configuración CRM
          </Link>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo maestro para {title.toLowerCase()}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <Card className="p-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder={`Buscar en ${title.toLowerCase()}...`}
          className="max-w-md"
        />
      </Card>

      {showForm && (
        <Card className="space-y-4 p-4">
          <h2 className="font-semibold">{editing ? 'Editar' : 'Nuevo'} — {title}</h2>
          <FormRequiredLegend />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={CRM_CATALOG_NAME_EXAMPLES[category]}
            />
            <Input
              label="Código"
              optionalHint
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="Abreviatura para informes"
            />
            <Input
              label="Descripción"
              optionalHint
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Cuándo se usa esta opción"
            />
            <Input
              label="Color"
              optionalHint
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            />
            <Input
              label="Orden"
              optionalHint
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              placeholder="0"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Activo
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              loading={saveMutation.isPending}
              disabled={!form.name.trim()}
              onClick={() => saveMutation.mutate()}
            >
              Guardar
            </Button>
            <Button
              variant="secondary"
              onClick={guardedClose}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No hay registros.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Color</th>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/30">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.code ?? '—'}</td>
                  <td className="px-4 py-3">
                    {item.color ? (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-border/60"
                        style={{ backgroundColor: item.color }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{item.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Badge variant={item.isActive ? 'success' : 'muted'}>
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded p-2 hover:bg-muted"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-2 text-red-600 hover:bg-red-500/10"
                        onClick={() => {
                          if (!confirm(`¿Eliminar "${item.name}"?`)) return;
                          deleteMutation.mutate(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {!isValidCategory(categoryParam) && (
        <p className="text-sm text-amber-600">
          Categoría no válida. Mostrando {meta.label}.
        </p>
      )}
    </div>
  );
}
