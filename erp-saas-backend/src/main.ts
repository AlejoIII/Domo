import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { resolveCorsOrigin } from './common/config/cors.config';
import { assertProductionConfig } from './common/config/assert-production-config';
import { initSentry } from './common/observability/sentry.config';
import { setupBullBoard } from './common/queue/bull-board.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  const isProd = config.get('NODE_ENV') === 'production';

  assertProductionConfig(config, 'api');
  initSentry(config, 'api');

  // Cloudflare / reverse proxy: IPs y cookies Secure correctas
  const trustProxy = config.get('TRUST_PROXY', isProd ? '1' : 'false');
  if (trustProxy !== 'false' && trustProxy !== '0') {
    app.set('trust proxy', trustProxy === 'true' ? 1 : Number(trustProxy) || 1);
  }

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.useLogger(logger);
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: resolveCorsOrigin(config),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerEnabled =
    config.get('SWAGGER_ENABLED') === 'true'
    || (!isProd && config.get('SWAGGER_ENABLED') !== 'false');

  if (swaggerEnabled) {
    const swagger = new DocumentBuilder()
      .setTitle('Domo API')
      .setDescription('Base API for Domo')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'apiKey')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
    logger.log(`Swagger: /docs`);
  } else {
    logger.log('Swagger disabled (production default — set SWAGGER_ENABLED=true to expose)');
  }

  setupBullBoard(app, config);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
  if (config.get('BULL_BOARD_ENABLED') === 'true') {
    logger.log(`Bull Board: http://localhost:${port}/admin/queues?token=***`);
  }
}

bootstrap();
