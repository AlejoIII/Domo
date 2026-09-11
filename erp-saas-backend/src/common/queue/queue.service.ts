import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Queue } from 'bullmq';
import { EmailService } from '../mail/email.service';
import { RedisService } from '../redis/redis.service';
import {
  DEFAULT_JOB_OPTIONS,
  QUEUE_AUDIT,
  QUEUE_EMAIL,
  QUEUE_EXPORTS,
  QUEUE_WEBHOOKS,
} from './queue.constants';
import { runAuditJob, runEmailJob, runWebhookJob } from './job-handlers';
import type {
  AuditJobPayload,
  CustomEmailJobPayload,
  DocumentEmailJobPayload,
  EmailJobPayload,
  ExportJobPayload,
  InvitationEmailJobPayload,
  RawEmailJobPayload,
  WebhookJobPayload,
} from './queue.types';

export interface QueueStats {
  webhooks: { waiting: number; active: number; failed: number };
  audit: { waiting: number; active: number; failed: number };
  email: { waiting: number; active: number; failed: number };
  exports: { waiting: number; active: number; failed: number };
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly moduleRef: ModuleRef,
    @Optional() @InjectQueue(QUEUE_WEBHOOKS) private readonly webhooksQueue?: Queue,
    @Optional() @InjectQueue(QUEUE_AUDIT) private readonly auditQueue?: Queue,
    @Optional() @InjectQueue(QUEUE_EMAIL) private readonly emailQueue?: Queue,
    @Optional() @InjectQueue(QUEUE_EXPORTS) private readonly exportsQueue?: Queue,
  ) {}

  enqueueWebhook(payload: WebhookJobPayload): void {
    void this.addJob(QUEUE_WEBHOOKS, 'webhook', payload);
  }

  enqueueAudit(payload: AuditJobPayload): void {
    void this.addJob(QUEUE_AUDIT, 'audit', payload);
  }

  enqueueEmail(payload: EmailJobPayload): void {
    void this.addJob(QUEUE_EMAIL, 'email', payload);
  }

  enqueueExport(payload: ExportJobPayload, idempotentJobId: string): void {
    void this.addJob(QUEUE_EXPORTS, 'export', payload, idempotentJobId);
  }

  enqueueRawEmail(payload: Omit<RawEmailJobPayload, 'kind'>): void {
    this.enqueueEmail({ kind: 'raw', ...payload });
  }

  enqueueCustomEmail(payload: Omit<CustomEmailJobPayload, 'kind'>): void {
    this.enqueueEmail({ kind: 'custom', ...payload });
  }

  enqueueDocumentEmail(payload: Omit<DocumentEmailJobPayload, 'kind'>): void {
    this.enqueueEmail({ kind: 'document', ...payload });
  }

  enqueueInvitationEmail(payload: Omit<InvitationEmailJobPayload, 'kind'>): void {
    this.enqueueEmail({ kind: 'invitation', ...payload });
  }

  async getStats(): Promise<QueueStats | null> {
    if (!this.canUseBull()) return null;

    const [webhooks, audit, email, exports] = await Promise.all([
      this.counts(this.webhooksQueue!),
      this.counts(this.auditQueue!),
      this.counts(this.emailQueue!),
      this.counts(this.exportsQueue!),
    ]);

    return { webhooks, audit, email, exports };
  }

  private async addJob(
    queueName: string,
    jobName: string,
    payload: unknown,
    jobId?: string,
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    if (queue && this.canUseBull()) {
      try {
        await queue.add(jobName, payload, {
          ...DEFAULT_JOB_OPTIONS,
          ...(jobId ? { jobId } : {}),
        });
        return;
      } catch (err) {
        this.logger.warn(
          `BullMQ enqueue failed (${queueName}/${jobName}): ${(err as Error).message}`,
        );
      }
    }

    void this.processInline(queueName, payload);
  }

  private getQueue(queueName: string): Queue | undefined {
    switch (queueName) {
      case QUEUE_WEBHOOKS:
        return this.webhooksQueue;
      case QUEUE_AUDIT:
        return this.auditQueue;
      case QUEUE_EMAIL:
        return this.emailQueue;
      case QUEUE_EXPORTS:
        return this.exportsQueue;
      default:
        return undefined;
    }
  }

  private canUseBull(): boolean {
    return (
      !!this.webhooksQueue &&
      !!this.auditQueue &&
      !!this.emailQueue &&
      !!this.exportsQueue &&
      this.redis.isReady()
    );
  }

  private async processInline(queueName: string, payload: unknown): Promise<void> {
    try {
      switch (queueName) {
        case QUEUE_WEBHOOKS: {
          const { WebhookDispatcherService } = await import(
            '../../modules/integrations/webhook-dispatcher.service'
          );
          const webhooks = this.moduleRef.get(WebhookDispatcherService, { strict: false });
          await runWebhookJob(webhooks, payload as WebhookJobPayload);
          break;
        }
        case QUEUE_AUDIT: {
          const { AuditService } = await import('../audit/audit.service');
          const audit = this.moduleRef.get(AuditService, { strict: false });
          await runAuditJob(audit, payload as AuditJobPayload);
          break;
        }
        case QUEUE_EMAIL: {
          const email = this.moduleRef.get(EmailService, { strict: false });
          await runEmailJob(email, payload as EmailJobPayload);
          break;
        }
        case QUEUE_EXPORTS: {
          const { ExportJobHandler } = await import('./export-job.handler');
          const handler = this.moduleRef.get(ExportJobHandler, { strict: false });
          await handler.handle(payload as ExportJobPayload);
          break;
        }
      }
    } catch (err) {
      this.logger.error(
        `Inline job failed (${queueName}): ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  private async counts(queue: Queue) {
    const [waiting, active, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
    ]);
    return { waiting, active, failed };
  }
}
