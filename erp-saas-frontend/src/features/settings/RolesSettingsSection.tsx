import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { InvitationsSection } from '@/features/settings/InvitationsSection';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import {
  createRole, deleteRole, fetchPermissions, fetchRoles, updateRole,
} from '@/services/roles.service';
import { assignUserRole, fetchCompanyUsers } from '@/services/settings.service';
import {
  EMPLOYEE_DEFAULT_PERMISSION_NAMES,
  formatPermissionGroup,
  formatPermissionLabel,
  isSensitivePermission,
} from '@/lib/format-permissions';
import type { Permission, Role } from '@/types/role.types';

export function RolesSettingsSection({
  canWrite,
  onDirtyChange,
  requestLeave,
}: {
  canWrite: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  requestLeave?: (action: () => void) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [roleEditorDirty, setRoleEditorDirty] = useState(false);
  const [inviteDirty, setInviteDirty] = useState(false);

  useEffect(() => {
    onDirtyChange?.(roleEditorDirty || inviteDirty);
  }, [roleEditorDirty, inviteDirty, onDirtyChange]);

  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: fetchRoles });
  const permsQuery = useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions });
  const usersQuery = useQuery({
    queryKey: ['settings', 'users'],
    queryFn: fetchCompanyUsers,
    enabled: canWrite,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    queryClient.invalidateQueries({ queryKey: ['settings', 'users'] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string | null }) =>
      assignUserRole(userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'users'] }),
  });

  if (rolesQuery.isLoading || permsQuery.isLoading) {
    return <div className="flex justify-center py-12"><Loader /></div>;
  }

  if (rolesQuery.isError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">No se pudieron cargar los roles. Reinicia el backend.</p>
      </Card>
    );
  }

  const roles = rolesQuery.data ?? [];
  const permissions = permsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Roles</h2>
            <p className="text-sm text-muted-foreground">Define permisos por rol</p>
          </div>
          {canWrite && (
            <Button onClick={() => { setCreating(true); setEditing(null); }}>
              <Plus className="h-4 w-4" />
              Nuevo rol
            </Button>
          )}
        </div>

        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay roles. Crea el primero.</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {roles.map((role) => (
              <li key={role.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{role.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {role.description || 'Sin descripción'} · {role.usersCount} usuario(s) ·{' '}
                    {role.permissions.length} permiso(s)
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {canWrite && (
                    <>
                      <button
                        type="button"
                        className="rounded p-2 hover:bg-muted"
                        onClick={() => { setEditing(role); setCreating(false); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {role.name.toLowerCase() !== 'admin' && (
                        <button
                          type="button"
                          className="rounded p-2 text-red-600 hover:bg-red-500/10"
                          onClick={async () => {
                            if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
                            try {
                              await deleteMutation.mutateAsync(role.id);
                            } catch {
                              alert('No se pudo eliminar (puede tener usuarios asignados).');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {(creating || editing) && canWrite && (
        <RoleEditor
          key={editing?.id ?? 'new'}
          role={editing}
          permissions={permissions}
          onDirtyChange={setRoleEditorDirty}
          requestLeave={requestLeave}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            invalidate();
          }}
        />
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-lg font-semibold">Usuarios y roles</h2>
          <p className="text-sm text-muted-foreground">
            {canWrite
              ? 'Asigna un rol a cada usuario de la empresa'
              : 'Listado de usuarios (solo lectura)'}
          </p>
        </div>
        {!canWrite ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            Necesitas permiso de escritura en configuración para asignar roles.
          </p>
        ) : usersQuery.isLoading ? (
          <div className="flex justify-center py-8"><Loader /></div>
        ) : usersQuery.isError ? (
          <p className="px-6 py-8 text-sm text-red-600">No se pudieron cargar los usuarios.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="px-6 py-2 font-medium">Usuario</th>
                <th className="px-6 py-2 font-medium">Email</th>
                <th className="px-6 py-2 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/30">
                  <td className="px-6 py-2 font-medium">
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-6 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-2">
                    {canWrite ? (
                      <select
                        className="rounded-lg border border-border/70 bg-card px-2 py-1.5 text-sm"
                        value={u.roleId ?? ''}
                        disabled={assignMutation.isPending}
                        onChange={(e) =>
                          assignMutation.mutate({
                            userId: u.id,
                            roleId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Sin rol</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground">
                        {roles.find((r) => r.id === u.roleId)?.name ?? 'Sin rol'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {canWrite && <InvitationsSection onDirtyChange={setInviteDirty} />}
    </div>
  );
}

function employeeDefaultIds(permissions: Permission[]): Set<string> {
  const names = new Set<string>(EMPLOYEE_DEFAULT_PERMISSION_NAMES);
  return new Set(permissions.filter((p) => names.has(p.name)).map((p) => p.id));
}

function RoleEditor({
  role,
  permissions,
  onDirtyChange,
  requestLeave,
  onCancel,
  onSaved,
}: {
  role: Role | null;
  permissions: Permission[];
  onDirtyChange?: (dirty: boolean) => void;
  requestLeave?: (action: () => void) => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isAdminRole = role?.name.toLowerCase() === 'admin';
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(
    role?.description ?? 'Empleado — acceso operativo estándar',
  );
  const [selected, setSelected] = useState<Set<string>>(() =>
    role
      ? new Set(role.permissions.map((p) => p.id))
      : employeeDefaultIds(permissions),
  );
  const [error, setError] = useState<string | null>(null);

  const { isDirty, markClean } = useDraftDirty(
    { name, description, selectedIds: [...selected].sort() },
    role?.id ?? 'new',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      const group = p.name.split('.')[0] ?? 'otros';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(p);
    }
    return [...map.entries()];
  }, [permissions]);

  const selectedSensitive = useMemo(
    () =>
      permissions.filter((p) => selected.has(p.id) && isSensitivePermission(p.name)),
    [permissions, selected],
  );

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description: description || undefined,
        permissionIds: [...selected],
      };
      return role ? updateRole(role.id, payload) : createRole(payload);
    },
    onSuccess: () => {
      markClean();
      onSaved();
    },
    onError: () => setError('No se pudo guardar el rol'),
  });

  const toggle = (id: string) => {
    if (isAdminRole) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyEmployeeTemplate = () => {
    if (isAdminRole) return;
    setSelected(employeeDefaultIds(permissions));
  };

  const handleCancel = () => {
    if (requestLeave) requestLeave(onCancel);
    else onCancel();
  };

  return (
    <Card className="space-y-4 p-6">
      <h3 className="font-semibold">{role ? `Editar: ${role.name}` : 'Nuevo rol'}</h3>
      {!role && (
        <p className="text-sm text-muted-foreground">
          Por defecto se aplica la plantilla de <strong>empleado</strong> (operativa diaria).
          Revisa con cuidado los permisos marcados como sensibles.
        </p>
      )}
      {isAdminRole && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          El rol admin tiene acceso completo. No se puede reducir desde aquí.
        </p>
      )}
      <FormRequiredLegend />
      <Input
        label="Nombre"
        required
        placeholder="Comercial"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isAdminRole}
      />
      <Input
        label="Descripción"
        optionalHint
        placeholder="Acceso a clientes, presupuestos y pedidos"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isAdminRole}
      />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Permisos</p>
          {!isAdminRole && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={applyEmployeeTemplate}
            >
              Restaurar plantilla empleado
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Marca solo lo necesario. Los permisos sensibles dan acceso a datos o configuración crítica.
        </p>
        {selectedSensitive.length > 0 && !isAdminRole && (
          <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Cuidado: permisos sensibles activos</p>
              <p className="text-xs opacity-90">
                {selectedSensitive.map((p) => formatPermissionLabel(p.name)).join(' · ')}
              </p>
            </div>
          </div>
        )}
        {grouped.map(([group, perms]) => (
          <div key={group}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {formatPermissionGroup(group)}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {perms.map((p) => {
                const sensitive = isSensitivePermission(p.name);
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-2 rounded-md px-1 py-0.5 text-sm ${
                      sensitive ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={isAdminRole || selected.has(p.id)}
                      disabled={isAdminRole}
                      onChange={() => toggle(p.id)}
                    />
                    <span className="leading-snug">
                      {formatPermissionLabel(p.name)}
                      {sensitive && (
                        <span className="ml-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          · sensible
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleCancel}>Cancelar</Button>
        {!isAdminRole && (
          <Button
            loading={mutation.isPending}
            disabled={name.trim().length < 2}
            onClick={() => { setError(null); mutation.mutate(); }}
          >
            Guardar rol
          </Button>
        )}
      </div>
    </Card>
  );
}
