import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { WorkerModule } from './worker.module';
import { initSentry, Sentry } from './common/observability/sentry.config';
import { assertProductionConfig } from './common/config/assert-production-config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);

  assertProductionConfig(config, 'worker');
  initSentry(config, 'worker');
  app.useLogger(logger);

  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
    logger.error(`Unhandled rejection: ${String(reason)}`);
  });

  process.on('uncaughtException', (err) => {
    Sentry.captureException(err);
    logger.error(`Uncaught exception: ${err.message}`, err.stack);
  });

  logger.log('BullMQ worker started (webhooks, audit, email, exports, audit retention cron)');
}

bootstrap().catch((err) => {
  Sentry.captureException(err);
  console.error('Worker failed to start:', err);
  process.exit(1);
});
