import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchBox } from '@/components/ui/SearchBox';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { TableImagePreview } from '@/components/ui/TableImagePreview';
import { fetchEmployees, deleteEmployee } from '@/services/employees.service';
import { getEntity } from '@/config/entities.config';
import { employeeFullName } from '@/types/employee.types';
import { usePreferencesStore } from '@/store/preferences.store';

export function EmployeesPage() {
  const entity = getEntity('employees');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const pageSize = usePreferencesStore((s) => s.pageSize);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['employees', page, pageSize, search, department],
    queryFn: () => fetchEmployees({
      page,
      limit: pageSize,
      search: search || undefined,
      department: department || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{entity.plural}</h1>
          <p className="text-sm text-muted-foreground">Gestión de personal</p>
        </div>
        <Button onClick={() => navigate('/hr/employees/new')}>
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </Button>
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <SearchBox
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Buscar por nombre, email o cargo..."
          className="max-w-md flex-1"
        />
        <Input
          label="Departamento"
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
          placeholder="Administración, Ventas…"
          className="w-full sm:w-44"
        />
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader /></div>
        ) : isError ? (
          <p className="p-6 text-sm text-red-600">Error al cargar empleados.</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            No hay empleados.{' '}
            <Link to="/hr/employees/new" className="text-primary hover:underline">Crear el primero</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium w-20"></th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Cargo</th>
                  <th className="px-4 py-3 font-medium">Departamento</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((employee) => (
                  <tr
                    key={employee.id}
                    className="cursor-pointer border-b border-border/40 hover:bg-muted/20"
                    onClick={() => navigate(`/hr/employees/${employee.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {employee.imageUrl ? (
                        <TableImagePreview
                          src={employee.imageUrl}
                          alt={employeeFullName(employee)}
                          title={employeeFullName(employee)}
                          variant="circle"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{employeeFullName(employee)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.jobTitle ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.department ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={employee.isActive ? 'success' : 'muted'}>
                        {employee.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => navigate(`/hr/employees/${employee.id}`)} className="rounded p-2 hover:bg-muted">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar a ${employeeFullName(employee)}?`)) return;
                            await deleteMutation.mutateAsync(employee.id);
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
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
