import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { RedisService } from '../../common/redis/redis.service';

type MemoryEntry = { count: number; expiresAt: number; lockedUntil?: number };

@Injectable()
export class AccountLockoutService {
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private get maxAttempts(): number {
    return Number(this.config.get('ACCOUNT_LOCKOUT_MAX_ATTEMPTS', '5'));
  }

  private get windowSeconds(): number {
    return Number(this.config.get('ACCOUNT_LOCKOUT_WINDOW_SECONDS', '900'));
  }

  private get lockoutSeconds(): number {
    return Number(this.config.get('ACCOUNT_LOCKOUT_DURATION_SECONDS', '900'));
  }

  private keyFor(email: string): string {
    const normalized = email.trim().toLowerCase();
    const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 24);
    return `domo:lockout:${hash}`;
  }

  private cleanupMemory(key: string, now: number) {
    const entry = this.memory.get(key);
    if (!entry) return;
    if (entry.expiresAt <= now && (!entry.lockedUntil || entry.lockedUntil <= now)) {
      this.memory.delete(key);
    }
  }

  async assertNotLocked(email: string): Promise<void> {
    const key = this.keyFor(email);
    const now = Date.now();

    if (this.redis.isReady()) {
      const lockedUntilRaw = await this.redis.get(`${key}:locked`);
      if (lockedUntilRaw) {
        const lockedUntil = Number(lockedUntilRaw);
        if (Number.isFinite(lockedUntil) && lockedUntil > now) {
          throw this.buildLockedException(lockedUntil, now);
        }
      }
      return;
    }

    this.cleanupMemory(key, now);
    const entry = this.memory.get(key);
    if (entry?.lockedUntil && entry.lockedUntil > now) {
      throw this.buildLockedException(entry.lockedUntil, now);
    }
  }

  async recordFailedAttempt(email: string): Promise<void> {
    const key = this.keyFor(email);
    const now = Date.now();

    if (this.redis.isReady()) {
      const count = await this.redis.incrWithTtl(`${key}:attempts`, this.windowSeconds);
      if (count !== null && count >= this.maxAttempts) {
        const lockedUntil = now + this.lockoutSeconds * 1000;
        await this.redis.set(`${key}:locked`, String(lockedUntil), this.lockoutSeconds);
        await this.redis.del(`${key}:attempts`);
      }
      return;
    }

    this.cleanupMemory(key, now);
    const entry = this.memory.get(key) ?? {
      count: 0,
      expiresAt: now + this.windowSeconds * 1000,
    };

    if (entry.expiresAt <= now) {
      entry.count = 0;
      entry.expiresAt = now + this.windowSeconds * 1000;
      entry.lockedUntil = undefined;
    }

    entry.count += 1;
    if (entry.count >= this.maxAttempts) {
      entry.lockedUntil = now + this.lockoutSeconds * 1000;
      entry.count = 0;
    }

    this.memory.set(key, entry);
  }

  async clearFailedAttempts(email: string): Promise<void> {
    const key = this.keyFor(email);

    if (this.redis.isReady()) {
      await this.redis.del(`${key}:attempts`, `${key}:locked`);
      return;
    }

    this.memory.delete(key);
  }

  private buildLockedException(lockedUntil: number, now: number): HttpException {
    const minutes = Math.max(1, Math.ceil((lockedUntil - now) / 60_000));
    return new HttpException(
      `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Inténtalo en ${minutes} minuto(s).`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
