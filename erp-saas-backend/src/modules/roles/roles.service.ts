import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { CacheInvalidationService } from '../../common/cache/cache-invalidation.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import {
  CATALOG_PERMISSIONS,
  EMPLOYEE_DEFAULT_PERMISSIONS,
  SENSITIVE_PERMISSIONS,
} from './role-permissions.catalog';

export { CATALOG_PERMISSIONS, EMPLOYEE_DEFAULT_PERMISSIONS, SENSITIVE_PERMISSIONS };

const roleInclude = {
  permissions: { include: { permission: true } },
  _count: { select: { users: true } },
} as const;

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  async ensurePermissions() {
    await Promise.all(
      CATALOG_PERMISSIONS.map((name) =>
        this.prisma.permission.upsert({
          where: { name },
          update: {},
          create: { name, description: name },
        }),
      ),
    );
    return this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  listPermissions() {
    return this.cache.getOrSet(
      CacheKeys.permissionsCatalog(),
      () => this.ensurePermissions(),
      this.cache.settingsTtlSec,
    );
  }

  findAll(companyId: string) {
    return this.cache.getOrSet(
      CacheKeys.rolesList(companyId),
      () => this.loadAllRoles(companyId),
      this.cache.settingsTtlSec,
    );
  }

  private async loadAllRoles(companyId: string) {
    await this.ensureEmployeeRole(companyId);
    const roles = await this.prisma.role.findMany({
      where: { companyId, deletedAt: null },
      include: roleInclude,
      orderBy: { name: 'asc' },
    });
    return roles.map(this.mapRole);
  }

  /** Empresas antiguas: crea el rol «empleado» si falta. */
  private async ensureEmployeeRole(companyId: string) {
    const existing = await this.prisma.role.findFirst({
      where: { companyId, name: 'empleado', deletedAt: null },
      select: { id: true },
    });
    if (existing) return;

    const catalog = await this.ensurePermissions();
    const employeeNames = new Set<string>(EMPLOYEE_DEFAULT_PERMISSIONS);
    const permissionIds = catalog.filter((p) => employeeNames.has(p.name)).map((p) => p.id);

    await this.prisma.role.create({
      data: {
        companyId,
        name: 'empleado',
        description: 'Empleado — acceso operativo estándar',
        permissions: permissionIds.length
          ? { create: permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
    });
    await this.cacheInvalidation.onRolesChanged(companyId);
  }

  findOne(id: string, companyId: string) {
    return this.cache.getOrSet(
      CacheKeys.roleOne(companyId, id),
      () => this.loadRole(id, companyId),
      this.cache.settingsTtlSec,
    );
  }

  private async loadRole(id: string, companyId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId, deletedAt: null },
      include: roleInclude,
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return this.mapRole(role);
  }

  async create(companyId: string, dto: CreateRoleDto) {
    const exists = await this.prisma.role.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (exists) throw new ConflictException('Ya existe un rol con ese nombre');
    if (dto.name.trim().toLowerCase() === 'admin') {
      throw new BadRequestException('El rol admin se crea automáticamente al registrar la empresa');
    }

    const catalog = await this.ensurePermissions();
    let permissionIds = dto.permissionIds ?? [];

    // Sin selección explícita → plantilla empleado raso
    if (!dto.permissionIds || dto.permissionIds.length === 0) {
      const employeeNames = new Set<string>(EMPLOYEE_DEFAULT_PERMISSIONS);
      permissionIds = catalog.filter((p) => employeeNames.has(p.name)).map((p) => p.id);
    }

    const role = await this.prisma.role.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description ?? 'Empleado — acceso operativo estándar',
        permissions: permissionIds.length
          ? {
              create: permissionIds.map((permissionId) => ({ permissionId })),
            }
          : undefined,
      },
      include: roleInclude,
    });
    await this.cacheInvalidation.onRolesChanged(companyId);
    return this.mapRole(role);
  }

  async update(id: string, companyId: string, dto: UpdateRoleDto) {
    await this.loadRole(id, companyId);

    if (dto.name) {
      const clash = await this.prisma.role.findFirst({
        where: {
          companyId,
          name: dto.name,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (clash) throw new ConflictException('Ya existe un rol con ese nombre');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      });

      if (dto.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (dto.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
          });
        }
      }
    });

    await this.cacheInvalidation.onRolesChanged(companyId, id);
    return this.loadRole(id, companyId);
  }

  async remove(id: string, companyId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.name.toLowerCase() === 'admin') {
      throw new BadRequestException('No se puede eliminar el rol administrador');
    }
    if (role._count.users > 0) {
      throw new BadRequestException('No se puede eliminar: hay usuarios asignados');
    }

    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.cacheInvalidation.onRolesChanged(companyId, id);
    return { message: 'Rol eliminado' };
  }

  private mapRole(role: {
    id: string;
    name: string;
    description: string | null;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
    permissions: { permission: { id: string; name: string; description: string | null } }[];
    _count?: { users: number };
  }) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      companyId: role.companyId,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      usersCount: role._count?.users ?? 0,
      permissions: role.permissions.map((rp) => rp.permission),
    };
  }
}
