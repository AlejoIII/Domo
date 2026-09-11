import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaReadService } from '../../common/database/prisma-read.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { StorageService } from '../../common/storage/storage.service';
import { EmailService } from '../../common/mail/email.service';
import { QueueService } from '../../common/queue/queue.service';

type CheckStatus = 'ok' | 'degraded' | 'error' | 'skipped';

export interface ServiceCheck {
  status: CheckStatus;
  detail?: string;
}

export interface HealthStatusResponse {
  status: 'ok' | 'degraded' | 'error';
  checks: {
    database: ServiceCheck;
    redis: ServiceCheck;
    storage: ServiceCheck;
    email: ServiceCheck;
    queues: ServiceCheck;
  };
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly startedAt = new Date().toISOString();

  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaRead: PrismaReadService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
    private readonly email: EmailService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {}

  health() {
    return { status: 'ok' };
  }

  version() {
    return {
      name: 'domo-api',
      version: this.config.get<string>('APP_VERSION')
        ?? process.env.npm_package_version
        ?? '1.0.0',
      commit: this.config.get<string>('GIT_COMMIT') ?? null,
      environment: this.config.get<string>('NODE_ENV') ?? 'development',
      startedAt: this.startedAt,
    };
  }

  async status(): Promise<HealthStatusResponse> {
    const [database, redis, storage, email, queues] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkEmail(),
      this.checkQueues(),
    ]);

    const checks = { database, redis, storage, email, queues };
    const statuses = Object.values(checks).map((c) => c.status);
    const overall = statuses.includes('error')
      ? 'error'
      : statuses.includes('degraded')
        ? 'degraded'
        : 'ok';

    return {
      status: overall,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /** Estado sanitizado para página pública (sin detalles internos). */
  async publicStatus() {
    const full = await this.status();
    return {
      status: full.status,
      timestamp: full.timestamp,
      components: {
        api: 'ok' as const,
        database: full.checks.database.status,
        redis: full.checks.redis.status,
      },
    };
  }

  private async checkDatabase(): Promise<ServiceCheck> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const detail = this.prismaRead.isReplica
        ? 'primary ok; read replica configured'
        : 'primary only';
      return { status: 'ok', detail };
    } catch (err) {
      return {
        status: 'error',
        detail: err instanceof Error ? err.message : 'Database unreachable',
      };
    }
  }

  private checkRedis(): ServiceCheck {
    if (!this.config.get<string>('REDIS_URL')) {
      return { status: 'skipped', detail: 'REDIS_URL not configured' };
    }
    if (this.redis.isReady()) {
      return { status: 'ok' };
    }
    return { status: 'degraded', detail: 'Redis configured but unavailable' };
  }

  private checkStorage(): ServiceCheck {
    const driver = this.storage.getDriver();
    if (driver === 'local') {
      return { status: 'ok', detail: 'local' };
    }

    const bucket = this.config.get<string>('S3_BUCKET');
    if (!bucket) {
      return { status: 'error', detail: 'STORAGE_DRIVER=s3 but S3_BUCKET is missing' };
    }

    const hasCredentials =
      !!this.config.get('S3_ACCESS_KEY') && !!this.config.get('S3_SECRET_KEY');
    if (!hasCredentials) {
      return { status: 'degraded', detail: 'S3 bucket set; using default credential chain' };
    }

    return { status: 'ok', detail: `s3:${bucket}` };
  }

  private checkEmail(): ServiceCheck {
    const status = this.email.getStatus();
    const isProd = this.config.get('NODE_ENV') === 'production';

    if (status.provider === 'console') {
      return isProd
        ? { status: 'degraded', detail: 'EMAIL_PROVIDER=console in production' }
        : { status: 'ok', detail: 'console (dev)' };
    }

    if (!status.configured) {
      return { status: 'degraded', detail: `${status.provider} not configured` };
    }

    return { status: 'ok', detail: status.provider };
  }

  private async checkQueues(): Promise<ServiceCheck> {
    if (!this.config.get<string>('REDIS_URL')) {
      return { status: 'skipped', detail: 'REDIS_URL not configured; inline job processing' };
    }
    if (!this.redis.isReady()) {
      return { status: 'degraded', detail: 'Redis unavailable; jobs processed inline in API' };
    }

    try {
      const stats = await this.queue.getStats();
      if (!stats) {
        return { status: 'degraded', detail: 'BullMQ queues not initialized' };
      }

      const failed =
        stats.webhooks.failed + stats.audit.failed + stats.email.failed + stats.exports.failed;
      const waiting =
        stats.webhooks.waiting + stats.audit.waiting + stats.email.waiting + stats.exports.waiting;

      if (failed > 0) {
        return {
          status: 'degraded',
          detail: `failed=${failed} waiting=${waiting}`,
        };
      }

      return {
        status: 'ok',
        detail: `waiting=${waiting} (run npm run start:worker to process)`,
      };
    } catch (err) {
      return {
        status: 'degraded',
        detail: err instanceof Error ? err.message : 'Queue check failed',
      };
    }
  }
}
