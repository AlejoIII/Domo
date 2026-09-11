import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { PlanFeatureException } from '../billing/plan-limit.exception';
import { PLAN_UPGRADE_HINT } from '../billing/plan-features.constants';
import { API_SCOPES, isApiScope } from './integrations.constants';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  listKeys(companyId: string) {
    return this.prisma.apiKey.findMany({
      where: { companyId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }

  async createKey(companyId: string, dto: CreateApiKeyDto) {
    await this.assertApiFeature(companyId);
    const scopes = dto.scopes?.length ? dto.scopes : [...API_SCOPES];
    for (const scope of scopes) {
      if (!isApiScope(scope)) {
        throw new BadRequestException(`Scope inválido: ${scope}`);
      }
    }

    const suffix = randomBytes(16).toString('hex');
    const plainKey = `erp_test_${suffix}`;
    const keyPrefix = plainKey.slice(0, 20);
    const keyHash = await bcrypt.hash(plainKey, 10);

    const row = await this.prisma.apiKey.create({
      data: {
        companyId,
        name: dto.name,
        keyPrefix,
        keyHash,
        scopes,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        createdAt: true,
      },
    });

    return { ...row, plainKey };
  }

  async revokeKey(companyId: string, id: string) {
    const row = await this.prisma.apiKey.findFirst({
      where: { id, companyId, revokedAt: null },
    });
    if (!row) throw new NotFoundException('API key no encontrada');
    await this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return { message: 'API key revocada' };
  }

  private async assertApiFeature(companyId: string) {
    const company = await this.planLimits.getCompanyWithPlan(companyId);
    const plan = this.planLimits.resolvePlan(company);
    if (!this.planLimits.hasFeature(plan.features, 'api')) {
      throw new PlanFeatureException('api', PLAN_UPGRADE_HINT.api);
    }
  }
}
