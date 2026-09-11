import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Injectable()
export class ApiRateLimitService {
  private readonly windowSec: number;
  private readonly maxRequests: number;
  private readonly memory = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.windowSec = Number(config.get('API_RATE_LIMIT_TTL_SEC', 60));
    this.maxRequests = Number(config.get('API_RATE_LIMIT_MAX', 120));
  }

  async assertWithinLimit(apiKeyId: string) {
    const key = `api_rate:${apiKeyId}`;
    const redisCount = await this.redis.incrWithTtl(key, this.windowSec);
    const count = redisCount ?? this.incrMemory(key);
    if (count > this.maxRequests) {
      throw new HttpException('Límite de peticiones API excedido', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private incrMemory(key: string) {
    const now = Date.now();
    const row = this.memory.get(key);
    if (!row || row.resetAt <= now) {
      this.memory.set(key, { count: 1, resetAt: now + this.windowSec * 1000 });
      return 1;
    }
    row.count += 1;
    return row.count;
  }
}
