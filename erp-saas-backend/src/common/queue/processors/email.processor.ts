import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE_EMAIL } from '../queue.constants';
import { JobHandlerService } from '../job-handler.service';
import type { EmailJobPayload } from '../queue.types';

@Processor(QUEUE_EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly handler: JobHandlerService) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    this.logger.debug(`Processing email job ${job.id} (${job.data.kind} → ${job.data.to})`);
    await this.handler.handleEmail(job.data);
  }
}
