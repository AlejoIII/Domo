import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaReadService } from '../../common/database/prisma-read.service';
import { CacheService } from '../../common/cache/cache.service';
import { QueueService } from '../../common/queue/queue.service';
import { RedisService } from '../../common/redis/redis.service';

export interface MetricsResponse {
  uptimeSec: number;
  memory: NodeJS.MemoryUsage;
  database: {
    readReplica: boolean;
    pgbouncer: boolean;
  };
  redis: {
    configured: boolean;
    ready: boolean;
  };
  cache: ReturnType<CacheService['getStats']>;
  queues: Awaited<ReturnType<QueueService['getStats']>>;
  alerts: string[];
  timestamp: string;
}

@Injectable()
export class MetricsService {
  constructor(
    private readonly prismaRead: PrismaReadService,
    private readonly cache: CacheService,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async getMetrics(): Promise<MetricsResponse> {
    const [queues, alerts] = await Promise.all([
      this.queue.getStats(),
      this.collectAlerts(),
    ]);

    const dbUrl = this.config.get<string>('DATABASE_URL') ?? '';
    const pgbouncer =
      dbUrl.includes('pgbouncer=true') || dbUrl.includes(':6432');

    return {
      uptimeSec: Math.round(process.uptime()),
      memory: process.memoryUsage(),
      database: {
        readReplica: this.prismaRead.isReplica,
        pgbouncer,
      },
      redis: {
        configured: !!this.config.get('REDIS_URL'),
        ready: this.redis.isReady(),
      },
      cache: this.cache.getStats(),
      queues,
      alerts,
      timestamp: new Date().toISOString(),
    };
  }

  private async collectAlerts(): Promise<string[]> {
    const alerts: string[] = [];
    const isProd = this.config.get('NODE_ENV') === 'production';

    if (isProd && !this.config.get('REDIS_URL')) {
      alerts.push('REDIS_URL missing in production');
    }

    if (this.config.get('REDIS_URL') && !this.redis.isReady()) {
      alerts.push('Redis configured but unavailable');
    }

    const failedThreshold = Number(
      this.config.get('QUEUE_FAILED_ALERT_THRESHOLD', '1'),
    );
    const waitingThreshold = Number(
      this.config.get('QUEUE_WAITING_ALERT_THRESHOLD', '500'),
    );

    try {
      const stats = await this.queue.getStats();
      if (stats) {
        const failed =
          stats.webhooks.failed +
          stats.audit.failed +
          stats.email.failed +
          stats.exports.failed;
        const waiting =
          stats.webhooks.waiting +
          stats.audit.waiting +
          stats.email.waiting +
          stats.exports.waiting;

        if (failed >= failedThreshold) {
          alerts.push(`Queue failed jobs: ${failed}`);
        }
        if (waiting >= waitingThreshold) {
          alerts.push(`Queue backlog: ${waiting} waiting`);
        }
      } else if (this.redis.isReady()) {
        alerts.push('BullMQ queues not initialized');
      }
    } catch {
      alerts.push('Unable to read queue metrics');
    }

    return alerts;
  }
}
