import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from './cache.service';

@Injectable()
export class CacheInvalidationService {
  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  onBusinessDataChanged(companyId: string): void {
    void this.cache.invalidateBusinessData(companyId);
  }

  onSettingsChanged(companyId: string, entityId?: string): void {
    void this.cache.invalidateSettings(companyId, entityId);
  }

  async onRolesChanged(companyId: string, roleId?: string): Promise<void> {
    await this.cache.invalidateRoles(companyId, roleId);
    await this.cache.invalidatePermissionsCatalog();
    if (roleId) {
      await this.invalidateUsersWithRole(companyId, roleId);
    }
  }

  onUserRoleChanged(userId: string): void {
    void this.cache.invalidateUserAuth(userId);
  }

  private async invalidateUsersWithRole(companyId: string, roleId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId, roleId, deletedAt: null },
      select: { id: true },
    });
    await Promise.all(users.map((u) => this.cache.invalidateUserAuth(u.id)));
  }
}
