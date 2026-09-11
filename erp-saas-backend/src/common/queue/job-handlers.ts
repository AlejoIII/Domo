import type { AuditService } from '../audit/audit.service';
import type { EmailService } from '../mail/email.service';
import type { WebhookDispatcherService } from '../../modules/integrations/webhook-dispatcher.service';
import type { WebhookEvent } from '../../modules/integrations/integrations.constants';
import type {
  AuditJobPayload,
  EmailJobPayload,
  WebhookJobPayload,
} from './queue.types';

export async function runWebhookJob(
  webhooks: WebhookDispatcherService,
  payload: WebhookJobPayload,
): Promise<void> {
  await webhooks.processDispatch(
    payload.companyId,
    payload.event as WebhookEvent,
    payload.data,
  );
}

export async function runAuditJob(
  audit: AuditService,
  payload: AuditJobPayload,
): Promise<void> {
  await audit.log(payload);
}

export async function runEmailJob(
  email: EmailService,
  payload: EmailJobPayload,
): Promise<void> {
  switch (payload.kind) {
    case 'raw': {
      const result = await email.sendRawMail(
        payload.to,
        payload.subject,
        payload.text,
        payload.html,
      );
      if (!result.sent) throw new Error(result.error ?? 'Email send failed');
      break;
    }
    case 'custom': {
      const result = await email.sendCustomEmail(payload);
      if (!result.sent) throw new Error(result.error ?? 'Email send failed');
      break;
    }
    case 'document': {
      const result = await email.sendDocumentLink(payload);
      if (!result.sent) throw new Error(result.error ?? 'Email send failed');
      break;
    }
    case 'invitation': {
      const result = await email.sendInvitation(
        payload.to,
        payload.inviteUrl,
        payload.companyName,
      );
      if (!result.sent) throw new Error(result.error ?? 'Email send failed');
      break;
    }
  }
}
