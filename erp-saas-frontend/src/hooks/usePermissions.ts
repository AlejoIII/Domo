import { useAuthStore } from '@/store/auth.store';
import {
  checkPermission,
  hasAllPermissions,
  hasAnyPermission,
} from '@/lib/permissions';

const EMPTY_PERMISSIONS: string[] = [];

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const permissions = user?.permissions ?? EMPTY_PERMISSIONS;
  const roleName = user?.roleName ?? null;
  const roleId = user?.roleId ?? null;
  const isAdmin = roleName?.toLowerCase() === 'admin';

  const ctx = { isAdmin, roleId, roleName, permissions };

  return {
    permissions,
    roleName,
    roleId,
    isAdmin,
    hasPermission: (permission: string) => checkPermission(permission, ctx),
    hasAny: (...perms: string[]) => hasAnyPermission(perms, ctx),
    hasAll: (...perms: string[]) => hasAllPermissions(perms, ctx),
    canRead: (module: string) => checkPermission(`${module}.read`, ctx),
    canWrite: (module: string) => checkPermission(`${module}.write`, ctx),
  };
}
