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
import { fetchInvoices, deleteInvoice } from '@/services/invoices.service';
import { fetchClients } from '@/services/clients.service';
import { getEntity } from '@/config/entities.config';
import { formatMoney, formatDate } from '@/lib/format';
import {
  INVOICE_DOCUMENT_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  statusBadgeVariant,
  statusLabel,
} from '@/lib/documentStatus';
import { usePreferencesStore } from '@/store/preferences.store';
import { useListFilters } from '@/hooks/useListFilters';
import { useAuthReady } from '@/hooks/useAuthReady';

const FILTER_DEFAULTS = {
  search: '',
  status: '',
  documentType: '',
  clientId: '',
  overdue: '',
};

const FILTER_KEYS = ['search', 'status', 'documentType', 'clientId', 'overdue'] as const;

export function InvoicesPage() {
  const entity = getEntity('invoices');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageSize = usePreferencesStore((s) => s.pageSize);
  const authReady = useAuthReady();

  const {
    applied,
    setFilter,
    applyFilters,
    page,
    setPage,
    resetFilters,
    hasActiveFilters,
  } = useListFilters('filters:invoices', FILTER_DEFAULTS, {
    mode: 'immediate',
    filterKeys: [...FILTER_KEYS],
  });

  const overdueOnly = applied.overdue === '1';

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'filter'],
    queryFn: () => fetchClients({ page: 1, limit: 100 }),
    enabled: authReady,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoices', page, pageSize, applied],
    enabled: authReady,
    queryFn: () => fetchInvoices({
      page,
      limit: pageSize,
      search: applied.search || undefined,
      clientId: applied.clientId || undefined,
      documentType: applied.documentType || undefined,
      status: overdueOnly ? undefined : (applied.status || undefined),
      overdue: overdueOnly || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  const handleStatusChange = (value: string) => {
    applyFilters({ ...applied, status: value, overdue: '' });
  };

  const handleOverdueChange = (checked: boolean) => {
    applyFilters({
      ...applied,
      overdue: checked ? '1' : '',
      status: checked ? '' : applied.status,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{entity.plural}</h1>
          <p className="text-sm text-muted-foreground">Rejilla de {entity.plural.toLowerCase()}</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="h-4 w-4" />
          Nueva {entity.singular.toLowerCase()}
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
            label="Cliente"
            value={applied.clientId}
            onChange={(v) => setFilter('clientId', v)}
            options={(clientsData?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
            className="w-full sm:w-48"
          />
          <SelectFilter
            label="Estado"
            value={applied.status}
            onChange={handleStatusChange}
            options={Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            className="w-full sm:w-44"
          />
          <SelectFilter
            label="Tipo"
            value={applied.documentType}
            onChange={(v) => setFilter('documentType', v)}
            options={Object.entries(INVOICE_DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            className="w-full sm:w-40"
          />
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => handleOverdueChange(e.target.checked)}
              className="rounded border-border"
            />
            Solo vencidas
          </label>
        </ListFilterBar>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-600">Error al cargar facturas.</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            No hay {entity.plural.toLowerCase()}.{' '}
            <Link to="/invoices/new" className="text-primary hover:underline">Crear la primera</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Emisión</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Cobrado</th>
                  <th className="px-4 py-3 font-medium">Pendiente</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="cursor-pointer border-b border-border/40 hover:bg-muted/20"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{invoice.number}</span>
                        {invoice.documentType === 'credit_note' && (
                          <Badge variant="muted">Rectificativa</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{invoice.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={statusBadgeVariant(invoice.status)}>
                          {statusLabel(INVOICE_STATUS_LABELS, invoice.status)}
                        </Badge>
                        {invoice.isOverdue && (
                          <Badge variant="danger">Vencida</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.documentType === 'credit_note'
                        ? `−${formatMoney(invoice.total)}`
                        : formatMoney(invoice.total)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatMoney(invoice.paidAmount ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      {(invoice.balanceDue ?? 0) > 0 ? (
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          {formatMoney(invoice.balanceDue ?? 0)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{formatMoney(0)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          className="rounded p-2 hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {invoice.documentType !== 'credit_note' && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`¿Eliminar factura ${invoice.number}?`)) return;
                              await deleteMutation.mutateAsync(invoice.id);
                            }}
                            className="rounded p-2 text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
