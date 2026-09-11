/**
 * Purga manual de particiones de auditoría / webhooks anteriores a la retención.
 *
 * Uso:
 *   npm run audit:purge
 *   AUDIT_RETENTION_DRY_RUN=true npm run audit:purge
 *   AUDIT_RETENTION_MONTHS=12 npm run audit:purge
 */
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../src/common/database/database.module';
import { AuditRetentionModule } from '../src/common/audit/audit-retention.module';
import { AuditRetentionService } from '../src/common/audit/audit-retention.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    DatabaseModule,
    AuditRetentionModule,
  ],
})
class AuditPurgeCliModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(AuditPurgeCliModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const retention = app.get(AuditRetentionService);
    const result = await retention.purgeExpiredPartitions();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
