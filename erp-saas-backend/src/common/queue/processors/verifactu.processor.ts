import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QUEUE_VERIFACTU } from '../queue.constants';
import { JobHandlerService } from '../job-handler.service';
import type { VerifactuJobPayload } from '../queue.types';

@Processor(QUEUE_VERIFACTU)
export class VerifactuProcessor extends WorkerHost {
  private readonly logger = new Logger(VerifactuProcessor.name);

  constructor(private readonly handler: JobHandlerService) {
    super();
  }

  async process(job: Job<VerifactuJobPayload>): Promise<void> {
    this.logger.debug(
      `Processing verifactu job ${job.id} record=${job.data.recordId}`,
    );
    await this.handler.handleVerifactu(job.data);
  }
}
