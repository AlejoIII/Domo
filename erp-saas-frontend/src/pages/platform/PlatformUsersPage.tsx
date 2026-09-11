import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { searchPlatformUsers, setPlatformUserStatus } from '@/services/platform.service';

export function PlatformUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');

  const usersQuery = useQuery({
    queryKey: ['platform', 'users', submitted],
    queryFn: () => searchPlatformUsers(submitted),
    enabled: submitted.length >= 2,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setPlatformUserStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform', 'users'] }),
  });

  return (
    <Card className="p-4">
      <h3 className="mb-3 font-semibold">Buscar usuario (email)</h3>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="email@empresa.com"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => setSubmitted(search.trim())}>Buscar</Button>
      </div>

      {usersQuery.isLoading && <Loader />}
      {submitted.length >= 2 && !usersQuery.isLoading && (
        <ul className="divide-y">
          {(usersQuery.data ?? []).length === 0 ? (
            <li className="py-4 text-sm text-muted-foreground">Sin resultados</li>
          ) : (
            usersQuery.data?.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.company.name} · {u.isActive ? 'activo' : 'inactivo'}
                    {u.isPlatformAdmin ? ' · platform admin' : ''}
                  </p>
                </div>
                {!u.isPlatformAdmin && (
                  <Button
                    className="px-3 py-1.5 text-xs"
                    variant={u.isActive ? 'danger' : 'secondary'}
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                  >
                    {u.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </Card>
  );
}
