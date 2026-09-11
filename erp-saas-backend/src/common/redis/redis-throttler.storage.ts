import { Injectable } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { RedisService } from './redis.service';

const KEY_PREFIX = 'domo:throttle:';

interface ThrottleRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly fallback = new ThrottlerStorageService();

  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottleRecord> {
    if (!this.redis.isReady()) {
      return this.fallback.increment(key, ttl, limit, blockDuration, throttlerName);
    }

    const hitsKey = `${KEY_PREFIX}${throttlerName}:${key}`;
    const blockKey = `${hitsKey}:block`;
    const ttlSec = Math.max(1, Math.ceil(ttl / 1000));
    const blockSec = Math.max(1, Math.ceil(blockDuration / 1000));

    const blocked = await this.redis.get(blockKey);
    if (blocked) {
      return {
        totalHits: limit + 1,
        timeToExpire: ttlSec,
        isBlocked: true,
        timeToBlockExpire: blockSec,
      };
    }

    const totalHits = (await this.redis.incrWithTtl(hitsKey, ttlSec)) ?? 1;
    let isBlocked = false;

    if (totalHits > limit) {
      isBlocked = true;
      await this.redis.set(blockKey, '1', blockSec);
    }

    return {
      totalHits,
      timeToExpire: ttlSec,
      isBlocked,
      timeToBlockExpire: isBlocked ? blockSec : 0,
    };
  }
}
