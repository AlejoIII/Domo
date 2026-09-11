import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE_AUDIT } from '../queue.constants';
import { JobHandlerService } from '../job-handler.service';
import type { AuditJobPayload } from '../queue.types';

@Processor(QUEUE_AUDIT)
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly handler: JobHandlerService) {
    super();
  }

  async process(job: Job<AuditJobPayload>): Promise<void> {
    this.logger.debug(`Processing audit job ${job.id} (${job.data.action})`);
    await this.handler.handleAudit(job.data);
  }
}
