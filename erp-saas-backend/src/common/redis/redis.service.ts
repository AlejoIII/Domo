import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — rate limits, cache and queues use in-memory/inline fallback');
      return;
    }
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
    });
    this.client.on('error', (err) => {
      this.logger.debug(`Redis error: ${err.message}`);
    });
    this.client.connect().catch((err) => {
      this.logger.warn(`Redis unavailable: ${err.message}`);
      this.client?.disconnect();
      this.client = null;
    });
  }

  isReady() {
    return !!this.client && this.client.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (!this.isReady()) return null;
    return this.client!.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) return false;
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client!.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client!.set(key, value);
    }
    return true;
  }

  async del(...keys: string[]): Promise<boolean> {
    if (!this.isReady() || keys.length === 0) return false;
    await this.client!.del(...keys);
    return true;
  }

  async setNx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isReady()) return true;
    const result = await this.client!.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async scanDelete(pattern: string): Promise<number> {
    if (!this.isReady()) return 0;
    let deleted = 0;
    let cursor = '0';
    do {
      const [next, keys] = await this.client!.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) {
        deleted += keys.length;
        await this.client!.del(...keys);
      }
    } while (cursor !== '0');
    return deleted;
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
    if (!this.isReady()) return null;
    const count = await this.client!.incr(key);
    if (count === 1) await this.client!.expire(key, ttlSeconds);
    return count;
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
