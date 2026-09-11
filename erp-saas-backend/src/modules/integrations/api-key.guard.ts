import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service';
import { ApiRateLimitService } from '../../common/redis/api-rate-limit.service';
import { API_SCOPES_KEY, type ApiKeyAuthContext } from './api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: ApiRateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = this.extractKey(request.headers.authorization, request.headers['x-api-key']);
    if (!rawKey) throw new UnauthorizedException('API key requerida');

    const prefix = rawKey.slice(0, 20);
    const row = await this.prisma.apiKey.findFirst({
      where: { keyPrefix: prefix, revokedAt: null },
    });
    if (!row) throw new UnauthorizedException('API key inválida');

    const valid = await bcrypt.compare(rawKey, row.keyHash);
    if (!valid) throw new UnauthorizedException('API key inválida');

    await this.rateLimit.assertWithinLimit(row.id);

    const ctx: ApiKeyAuthContext = {
      id: row.id,
      companyId: row.companyId,
      scopes: row.scopes,
    };
    request.apiKeyContext = ctx;

    const required = this.reflector.getAllAndOverride<string[]>(API_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.length) {
      const hasScope = required.every((s) => row.scopes.includes(s));
      if (!hasScope) throw new ForbiddenException('Scope insuficiente para esta operación');
    }

    void this.prisma.apiKey.update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }

  private extractKey(authorization?: string, xApiKey?: string | string[]) {
    if (typeof xApiKey === 'string' && xApiKey.startsWith('erp_')) return xApiKey;
    if (authorization?.startsWith('Bearer erp_')) {
      return authorization.slice('Bearer '.length).trim();
    }
    return null;
  }
}
