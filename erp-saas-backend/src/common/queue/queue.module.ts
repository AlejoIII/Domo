import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from '../mail/mail.module';
import { AuditService } from '../audit/audit.service';
import { WebhookDispatcherService } from '../../modules/integrations/webhook-dispatcher.service';
import { ReportsModule } from '../../modules/reports/reports.module';
import { JobHandlerService } from './job-handler.service';
import { QueueService } from './queue.service';
import { ExportStoreService } from './export-store.service';
import { ExportJobHandler } from './export-job.handler';
import {
  DEFAULT_JOB_OPTIONS,
  QUEUE_AUDIT,
  QUEUE_EMAIL,
  QUEUE_EXPORTS,
  QUEUE_PREFIX,
  QUEUE_VERIFACTU,
  QUEUE_WEBHOOKS,
} from './queue.constants';
import { AuditProcessor } from './processors/audit.processor';
import { EmailProcessor } from './processors/email.processor';
import { ExportProcessor } from './processors/export.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { VerifactuProcessor } from './processors/verifactu.processor';
import { VerifactuModule } from '../../modules/verifactu/verifactu.module';

function bullImports() {
  return [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379',
          maxRetriesPerRequest: null,
        },
        prefix: QUEUE_PREFIX,
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_WEBHOOKS, defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: QUEUE_AUDIT, defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: QUEUE_EMAIL, defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: QUEUE_EXPORTS, defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: QUEUE_VERIFACTU, defaultJobOptions: DEFAULT_JOB_OPTIONS },
    ),
  ];
}

@Global()
@Module({})
export class QueueModule {
  /** API process: enqueue only, no BullMQ processors. */
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [...bullImports(), MailModule, ReportsModule],
      providers: [QueueService, ExportStoreService, ExportJobHandler],
      exports: [QueueService, ExportStoreService, BullModule, ExportJobHandler],
    };
  }

  /** Worker process: processors + lean service providers (no HTTP interceptors). */
  static forWorker(): DynamicModule {
    const workerProviders: Provider[] = [
      QueueService,
      ExportStoreService,
      ExportJobHandler,
      JobHandlerService,
      AuditService,
      WebhookDispatcherService,
      WebhookProcessor,
      AuditProcessor,
      EmailProcessor,
      ExportProcessor,
      VerifactuProcessor,
    ];

    return {
      module: QueueModule,
      imports: [...bullImports(), MailModule, ReportsModule, VerifactuModule],
      providers: workerProviders,
      exports: [QueueService, ExportStoreService, BullModule, JobHandlerService],
    };
  }
}
