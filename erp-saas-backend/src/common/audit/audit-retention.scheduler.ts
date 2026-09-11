import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuditRetentionService } from './audit-retention.service';

@Injectable()
export class AuditRetentionScheduler {
  private readonly logger = new Logger(AuditRetentionScheduler.name);
  private running = false;

  constructor(private readonly retention: AuditRetentionService) {}

  /** Diario a las 03:15 UTC — solo en el proceso worker. */
  @Cron('15 3 * * *', { name: 'audit-partition-purge', timeZone: 'UTC' })
  async handleCron() {
    if (this.running) {
      this.logger.warn('Audit partition purge already running; skipping');
      return;
    }

    this.running = true;
    try {
      const result = await this.retention.purgeExpiredPartitions();
      this.logger.log(
        `Audit purge finished dryRun=${result.dryRun} cutoff=${result.cutoffMonth} `
        + `dropped=${result.dropped.length} skipped=${result.skipped.length}`,
      );
    } catch (err) {
      this.logger.error(
        'Audit partition purge failed',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      this.running = false;
    }
  }
}
