import { describe, expect, it } from 'vitest';
import { checkPermission, hasAllPermissions, hasAnyPermission } from '@/lib/permissions';

const salesUser = {
  isAdmin: false,
  roleId: 'role-1',
  roleName: 'ventas',
  permissions: ['clients.read', 'orders.read'],
};

describe('permissions', () => {
  it('grants all permissions to admin', () => {
    expect(
      checkPermission('invoices.write', {
        isAdmin: true,
        roleId: 'r1',
        roleName: 'admin',
        permissions: [],
      }),
    ).toBe(true);
  });

  it('grants access to owner bootstrap user without role permissions', () => {
    expect(
      checkPermission('settings.write', {
        isAdmin: false,
        roleId: null,
        roleName: null,
        permissions: [],
      }),
    ).toBe(true);
  });

  it('checks explicit permission for role users', () => {
    expect(checkPermission('clients.read', salesUser)).toBe(true);
    expect(checkPermission('invoices.read', salesUser)).toBe(false);
  });

  it('supports hasAny and hasAll helpers', () => {
    expect(hasAnyPermission(['invoices.read', 'clients.read'], salesUser)).toBe(true);
    expect(hasAllPermissions(['clients.read', 'orders.read'], salesUser)).toBe(true);
    expect(hasAllPermissions(['clients.read', 'invoices.read'], salesUser)).toBe(false);
  });
});
