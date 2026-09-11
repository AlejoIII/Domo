import { createHmac } from 'crypto';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { QueueService } from '../../common/queue/queue.service';
import { PrismaService } from '../../common/database/prisma.service';
import type { WebhookEvent } from './integrations.constants';

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly queue?: QueueService,
  ) {}

  emit(companyId: string, event: WebhookEvent, data: Record<string, unknown>) {
    if (this.queue) {
      this.queue.enqueueWebhook({ companyId, event, data });
      return;
    }
    void this.processDispatch(companyId, event, data).catch((err) => {
      this.logger.warn(`Webhook dispatch failed: ${(err as Error).message}`);
    });
  }

  async processDispatch(companyId: string, event: WebhookEvent, data: Record<string, unknown>) {
    return this.dispatch(companyId, event, data);
  }

  async dispatchTest(companyId: string, endpointId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, companyId, isActive: true },
    });
    if (!endpoint) return { ok: false, message: 'Webhook no encontrado' };

    const payload = {
      id: `test_${Date.now()}`,
      event: 'test.ping',
      createdAt: new Date().toISOString(),
      data: { message: 'Webhook de prueba desde Domo' },
    };

    const result = await this.deliver(endpoint.id, endpoint.url, endpoint.secret, 'test.ping', payload);
    return { ok: result.status === 'success', ...result };
  }

  private async dispatch(companyId: string, event: WebhookEvent, data: Record<string, unknown>) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { companyId, isActive: true, events: { has: event } },
    });
    if (!endpoints.length) return;

    const payload = {
      id: `${event}_${Date.now()}`,
      event,
      createdAt: new Date().toISOString(),
      data,
    };

    await Promise.all(
      endpoints.map((ep) =>
        this.deliver(ep.id, ep.url, ep.secret, event, payload),
      ),
    );
  }

  private async deliver(
    endpointId: string,
    url: string,
    secret: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    let status = 'failed';
    let responseStatus: number | null = null;
    let responseBody: string | null = null;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Domo-Event': event,
          'X-Domo-Signature': `t=${timestamp},v1=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      responseStatus = res.status;
      responseBody = (await res.text()).slice(0, 2000);
      status = res.ok ? 'success' : 'failed';
    } catch (err) {
      responseBody = (err as Error).message;
      this.logger.warn(`Webhook delivery failed (${url}): ${responseBody}`);
    }

    await this.prisma.webhookDelivery.create({
      data: {
        endpointId,
        event,
        payload: payload as Prisma.InputJsonValue,
        status,
        responseStatus: responseStatus ?? undefined,
        responseBody: responseBody ?? undefined,
      },
    });

    return { status, responseStatus, responseBody };
  }

  async retryDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: { id: deliveryId },
      include: { endpoint: true },
    });
    if (!delivery?.endpoint) {
      return { ok: false, message: 'Entrega no encontrada' };
    }

    const payload = delivery.payload as Record<string, unknown>;
    const result = await this.deliver(
      delivery.endpointId,
      delivery.endpoint.url,
      delivery.endpoint.secret,
      delivery.event,
      payload,
    );

    return { ok: result.status === 'success', ...result };
  }
}
