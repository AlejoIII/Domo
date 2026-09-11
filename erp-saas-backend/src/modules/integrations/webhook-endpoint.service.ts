import { createHmac, randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanLimitsService } from '../billing/plan-limits.service';
import { PlanFeatureException } from '../billing/plan-limit.exception';
import { PLAN_UPGRADE_HINT } from '../billing/plan-features.constants';
import {
  isWebhookEvent,
  WEBHOOK_EVENTS,
} from './integrations.constants';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhookEndpointService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  listEndpoints(companyId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  listDeliveries(companyId: string, limit = 20) {
    return this.prisma.webhookDelivery.findMany({
      where: { endpoint: { companyId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        event: true,
        status: true,
        responseStatus: true,
        attempts: true,
        createdAt: true,
        endpoint: { select: { id: true, url: true } },
      },
    });
  }

  async createEndpoint(companyId: string, dto: CreateWebhookDto) {
    await this.assertWebhooksFeature(companyId);
    this.validateEvents(dto.events);
    const secret = dto.secret ?? randomBytes(24).toString('hex');
    return this.prisma.webhookEndpoint.create({
      data: {
        companyId,
        url: dto.url,
        secret,
        events: dto.events,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        secret: true,
        createdAt: true,
      },
    });
  }

  async updateEndpoint(companyId: string, id: string, dto: UpdateWebhookDto) {
    await this.assertWebhooksFeature(companyId);
    const row = await this.prisma.webhookEndpoint.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException('Webhook no encontrado');
    if (dto.events) this.validateEvents(dto.events);
    return this.prisma.webhookEndpoint.update({
      where: { id },
      data: {
        url: dto.url,
        events: dto.events,
        isActive: dto.isActive,
        secret: dto.secret,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deleteEndpoint(companyId: string, id: string) {
    const row = await this.prisma.webhookEndpoint.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException('Webhook no encontrado');
    await this.prisma.webhookEndpoint.delete({ where: { id } });
    return { message: 'Webhook eliminado' };
  }

  availableEvents() {
    return WEBHOOK_EVENTS;
  }

  private validateEvents(events: string[]) {
    if (!events.length) {
      throw new BadRequestException('Selecciona al menos un evento');
    }
    for (const event of events) {
      if (!isWebhookEvent(event)) {
        throw new BadRequestException(`Evento inválido: ${event}`);
      }
    }
  }

  private async assertWebhooksFeature(companyId: string) {
    const company = await this.planLimits.getCompanyWithPlan(companyId);
    const plan = this.planLimits.resolvePlan(company);
    if (!this.planLimits.hasFeature(plan.features, 'webhooks')) {
      throw new PlanFeatureException('webhooks', PLAN_UPGRADE_HINT.webhooks);
    }
  }
}
