import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ADMIN_ONLY_KEY } from '../decorators/admin.decorator';

type GuardUser = {
  roleName?: string | null;
  permissions?: string[];
};

function isCompanyAdmin(user: GuardUser): boolean {
  if (user.roleName?.toLowerCase() === 'admin') return true;
  // Owner bootstrap sin rol asignado (casos legacy)
  if (!user.roleName && (!user.permissions || user.permissions.length === 0)) {
    return true;
  }
  return false;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    const adminOnly =
      this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, targets) === true;
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, targets);

    if (!adminOnly && !required?.length) return true;

    const user = context.switchToHttp().getRequest().user as GuardUser | undefined;
    if (!user) throw new ForbiddenException('No autorizado');

    if (adminOnly && !isCompanyAdmin(user)) {
      throw new ForbiddenException('Solo un administrador puede realizar esta acción');
    }

    if (!required?.length) return true;

    // Admin role bypasses permission checks
    if (isCompanyAdmin(user)) return true;

    if (!user.permissions) return true;

    const hasAll = required.every((p) => user.permissions!.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    return true;
  }
}
