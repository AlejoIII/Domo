import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../common/database/prisma.service';
import { CacheService } from '../../../common/cache/cache.service';
import { CacheKeys } from '../../../common/cache/cache-keys';
import { ACCESS_TOKEN_COOKIE } from '../auth-cookie.service';
export interface JwtAuthContext {
  id: string;
  email: string;
  companyId: string;
  roleId?: string | null;
  roleName?: string | null;
  permissions: string[];
  isPlatformAdmin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const raw = req?.cookies?.[ACCESS_TOKEN_COOKIE];
          return typeof raw === 'string' ? raw : null;
        },
      ]),
      secretOrKey: config.get('JWT_SECRET', 'change-me'),
    });  }

  validate(payload: { sub: string; email: string; companyId: string }) {
    return this.cache.getOrSet(
      CacheKeys.userAuth(payload.sub),
      () => this.loadAuthContext(payload),
      this.cache.permissionsTtlSec,
    );
  }

  private async loadAuthContext(payload: {
    sub: string;
    email: string;
    companyId: string;
  }): Promise<JwtAuthContext> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user) {
      return {
        id: payload.sub,
        email: payload.email,
        companyId: payload.companyId,
        permissions: [],
        isPlatformAdmin: false,
      };
    }

    const permissions =
      user.role?.permissions.map((rp: { permission: { name: string } }) => rp.permission.name) ?? [];

    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.role?.name ?? null,
      permissions,
      isPlatformAdmin: user.isPlatformAdmin ?? false,
    };
  }
}
