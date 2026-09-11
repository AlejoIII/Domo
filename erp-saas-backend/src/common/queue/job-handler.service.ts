import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EmailService } from '../mail/email.service';
import { runAuditJob, runEmailJob, runWebhookJob } from './job-handlers';
import type {
  AuditJobPayload,
  EmailJobPayload,
  WebhookJobPayload,
} from './queue.types';

@Injectable()
export class JobHandlerService {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly email: EmailService,
  ) {}

  async handleWebhook(payload: WebhookJobPayload): Promise<void> {
    const { WebhookDispatcherService } = await import(
      '../../modules/integrations/webhook-dispatcher.service'
    );
    const webhooks = this.moduleRef.get(WebhookDispatcherService, { strict: false });
    await runWebhookJob(webhooks, payload);
  }

  async handleAudit(payload: AuditJobPayload): Promise<void> {
    const { AuditService } = await import('../audit/audit.service');
    const audit = this.moduleRef.get(AuditService, { strict: false });
    await runAuditJob(audit, payload);
  }

  async handleEmail(payload: EmailJobPayload): Promise<void> {
    await runEmailJob(this.email, payload);
  }
}
