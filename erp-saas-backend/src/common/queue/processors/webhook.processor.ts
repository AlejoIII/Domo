import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE_WEBHOOKS } from '../queue.constants';
import { JobHandlerService } from '../job-handler.service';
import type { WebhookJobPayload } from '../queue.types';

@Processor(QUEUE_WEBHOOKS)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly handler: JobHandlerService) {
    super();
  }

  async process(job: Job<WebhookJobPayload>): Promise<void> {
    this.logger.debug(`Processing webhook job ${job.id} (${job.data.event})`);
    await this.handler.handleWebhook(job.data);
  }
}
