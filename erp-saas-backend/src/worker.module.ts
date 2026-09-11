import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { buildPinoHttpOptions } from './common/logging/pino.config';
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { CacheModule } from './common/cache/cache.module';
import { QueueModule } from './common/queue/queue.module';
import { AuditRetentionModule } from './common/audit/audit-retention.module';
import { AuditRetentionScheduler } from './common/audit/audit-retention.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: { ...buildPinoHttpOptions(), autoLogging: false },
    }),
    DatabaseModule,
    RedisModule,
    CacheModule,
    QueueModule.forWorker(),
    AuditRetentionModule,
  ],
  providers: [AuditRetentionScheduler],
})
export class WorkerModule {}
