export interface PermissionContext {
  isAdmin: boolean;
  roleId: string | null;
  roleName: string | null;
  permissions: string[];
}

export function checkPermission(permission: string, opts: PermissionContext): boolean {
  if (opts.isAdmin) return true;
  if (!opts.roleId) return true;
  if (!opts.roleName && opts.permissions.length === 0) return true;
  return opts.permissions.includes(permission);
}

export function hasAnyPermission(permissions: string[], opts: PermissionContext): boolean {
  return permissions.some((p) => checkPermission(p, opts));
}

export function hasAllPermissions(permissions: string[], opts: PermissionContext): boolean {
  return permissions.every((p) => checkPermission(p, opts));
}
