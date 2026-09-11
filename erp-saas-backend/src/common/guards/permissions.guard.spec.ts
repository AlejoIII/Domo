import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ADMIN_ONLY_KEY } from '../decorators/admin.decorator';

function mockContext(user?: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function mockMeta(opts: { adminOnly?: boolean; permissions?: string[] | undefined }) {
  return (key: unknown) => {
    if (key === ADMIN_ONLY_KEY) return opts.adminOnly === true ? true : undefined;
    if (key === PERMISSIONS_KEY) return opts.permissions;
    return undefined;
  };
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(mockMeta({}));
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('allows admin role regardless of permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation(mockMeta({ permissions: ['invoices.write'] }));
    expect(
      guard.canActivate(mockContext({ roleName: 'admin', permissions: [] })),
    ).toBe(true);
  });

  it('allows owner bootstrap user without permissions array', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation(mockMeta({ permissions: ['clients.read'] }));
    expect(guard.canActivate(mockContext({ roleName: null }))).toBe(true);
  });

  it('allows when user has all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation(mockMeta({ permissions: ['clients.read', 'clients.write'] }));
    expect(
      guard.canActivate(
        mockContext({ roleName: 'ventas', permissions: ['clients.read', 'clients.write'] }),
      ),
    ).toBe(true);
  });

  it('denies when a required permission is missing', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation(mockMeta({ permissions: ['invoices.write'] }));
    expect(() =>
      guard.canActivate(mockContext({ roleName: 'ventas', permissions: ['invoices.read'] })),
    ).toThrow(ForbiddenException);
  });

  it('denies when user is missing', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation(mockMeta({ permissions: ['clients.read'] }));
    expect(() => guard.canActivate(mockContext(undefined))).toThrow(ForbiddenException);
  });

  it('denies non-admin on admin-only routes even with settings.write', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(
      mockMeta({ adminOnly: true, permissions: ['settings.write'] }),
    );
    expect(() =>
      guard.canActivate(
        mockContext({ roleName: 'ventas', permissions: ['settings.write', 'settings.read'] }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows admin on admin-only routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(
      mockMeta({ adminOnly: true, permissions: ['settings.write'] }),
    );
    expect(
      guard.canActivate(mockContext({ roleName: 'admin', permissions: ['settings.write'] })),
    ).toBe(true);
  });

  it('reads permissions metadata key', () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation(mockMeta({ permissions: [] }));
    guard.canActivate(mockContext({ roleName: 'admin' }));
    expect(spy).toHaveBeenCalledWith(PERMISSIONS_KEY, expect.any(Array));
    expect(spy).toHaveBeenCalledWith(ADMIN_ONLY_KEY, expect.any(Array));
  });
});
