import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { fetchPlatformCompanies, setPlatformCompanyStatus } from '@/services/platform.service';
import { cn } from '@/lib/cn';

export function PlatformCompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const companiesQuery = useQuery({
    queryKey: ['platform', 'companies', page, search],
    queryFn: () => fetchPlatformCompanies({ page, limit: 20, search: search || undefined }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setPlatformCompanyStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform'] }),
  });

  if (companiesQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader /></div>;
  }

  const { items = [], meta } = companiesQuery.data ?? {};

  return (
    <Card className="p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar empresa…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">Empresa</th>
              <th className="pb-2">Plan</th>
              <th className="pb-2">Usuarios</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-border/40">
                <td className="py-3">
                  <Link to={`/platform/companies/${c.id}`} className="flex items-center gap-2 hover:text-primary">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.slug}</p>
                    </div>
                  </Link>
                </td>
                <td className="py-3">{c.planName}</td>
                <td className="py-3">{c.userCount}</td>
                <td className="py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs', c.isActive ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600')}>
                    {c.isActive ? 'Activa' : 'Suspendida'}
                  </span>
                </td>
                <td className="py-3">
                  <Button
                    className="px-3 py-1.5 text-xs"
                    variant={c.isActive ? 'danger' : 'secondary'}
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: c.id, isActive: !c.isActive })}
                  >
                    {c.isActive ? 'Suspender' : 'Reactivar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button className="px-3 py-1.5 text-xs" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="flex items-center text-sm">{page} / {meta.totalPages}</span>
          <Button className="px-3 py-1.5 text-xs" variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      )}
    </Card>
  );
}
