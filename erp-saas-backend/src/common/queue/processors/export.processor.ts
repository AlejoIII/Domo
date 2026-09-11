import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { ExportJobHandler } from '../export-job.handler';
import { QUEUE_EXPORTS } from '../queue.constants';
import type { ExportJobPayload } from '../queue.types';

@Processor(QUEUE_EXPORTS)
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(private readonly handler: ExportJobHandler) {
    super();
  }

  async process(job: Job<ExportJobPayload>): Promise<void> {
    this.logger.debug(`Processing export job ${job.id} (${job.data.reportType})`);
    await this.handler.handle(job.data);
  }
}
