import { Module } from '@nestjs/common';
import { AuditRetentionService } from './audit-retention.service';

/** Servicio de purga de particiones; el cron vive solo en el worker. */
@Module({
  providers: [AuditRetentionService],
  exports: [AuditRetentionService],
})
export class AuditRetentionModule {}
