import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { CacheKeys } from './cache-keys';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly memoryLocks = new Set<string>();
  private hits = 0;
  private misses = 0;
  private sets = 0;
  private readonly keyPrefix: string;
  private readonly defaultTtl: number;
  private readonly settingsTtl: number;
  private readonly permissionsTtl: number;

  constructor(
    private readonly redis: RedisService,
    config: ConfigService,
  ) {
    this.keyPrefix = config.get<string>('CACHE_KEY_PREFIX', 'domo:cache:');
    this.defaultTtl = Number(config.get<string>('CACHE_DEFAULT_TTL_SEC', '60'));
    this.settingsTtl = Number(config.get<string>('CACHE_SETTINGS_TTL_SEC', '300'));
    this.permissionsTtl = Number(config.get<string>('CACHE_PERMISSIONS_TTL_SEC', '300'));
  }

  get settingsTtlSec() {
    return this.settingsTtl;
  }

  get permissionsTtlSec() {
    return this.permissionsTtl;
  }

  private fullKey(key: string) {
    return `${this.keyPrefix}${key}`;
  }

  private readMemory(full: string): string | null {
    const entry = this.memory.get(full);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(full);
      return null;
    }
    return entry.value;
  }

  private writeMemory(full: string, value: string, ttlSeconds: number) {
    this.memory.set(full, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  private deleteMemoryByPrefix(fullPrefix: string) {
    for (const key of [...this.memory.keys()]) {
      if (key.startsWith(fullPrefix)) this.memory.delete(key);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const full = this.fullKey(key);
    const fromRedis = await this.redis.get(full);
    if (fromRedis) {
      this.hits += 1;
      try {
        return JSON.parse(fromRedis) as T;
      } catch {
        return null;
      }
    }
    const fromMemory = this.readMemory(full);
    if (!fromMemory) {
      this.misses += 1;
      return null;
    }
    this.hits += 1;
    try {
      return JSON.parse(fromMemory) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = this.defaultTtl): Promise<void> {
    this.sets += 1;
    const full = this.fullKey(key);
    const serialized = JSON.stringify(value);
    const stored = await this.redis.set(full, serialized, ttlSeconds);
    if (!stored) {
      this.writeMemory(full, serialized, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    const full = this.fullKey(key);
    this.memory.delete(full);
    await this.redis.del(full);
  }

  async delByPrefix(logicalPrefix: string): Promise<void> {
    const fullPrefix = this.fullKey(logicalPrefix);
    this.deleteMemoryByPrefix(fullPrefix);
    await this.redis.scanDelete(`${fullPrefix}*`);
  }

  async invalidateBusinessData(companyId: string): Promise<void> {
    await Promise.all([
      this.del(CacheKeys.dashboardStats(companyId)),
      this.delByPrefix(CacheKeys.reportsSalesPrefix(companyId)),
    ]);
  }

  async invalidateSettings(companyId: string, entityId?: string): Promise<void> {
    const tasks = [
      this.del(CacheKeys.companySettings(companyId)),
      this.del(CacheKeys.navigationPrefs(companyId)),
    ];
    if (entityId) {
      tasks.push(this.del(CacheKeys.formLayout(companyId, entityId)));
    } else {
      tasks.push(this.delByPrefix(`settings:form-layout:${companyId}:`));
    }
    await Promise.all(tasks);
  }

  async invalidateRoles(companyId: string, roleId?: string): Promise<void> {
    await this.del(CacheKeys.rolesList(companyId));
    if (roleId) {
      await this.del(CacheKeys.roleOne(companyId, roleId));
    } else {
      await this.delByPrefix(`roles:one:${companyId}:`);
    }
  }

  async invalidatePermissionsCatalog(): Promise<void> {
    await this.del(CacheKeys.permissionsCatalog());
  }

  async invalidateUserAuth(userId: string): Promise<void> {
    await this.del(CacheKeys.userAuth(userId));
  }

  /** @deprecated use invalidateBusinessData */
  async invalidateCompany(companyId: string): Promise<void> {
    return this.invalidateBusinessData(companyId);
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = this.defaultTtl,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const lockLogical = `${key}:lock`;
    const lockFull = this.fullKey(lockLogical);
    const acquired = this.memoryLocks.has(lockFull)
      ? false
      : await this.redis.setNx(lockFull, '1', 15);

    if (acquired) {
      this.memoryLocks.add(lockFull);
      try {
        const again = await this.get<T>(key);
        if (again !== null) return again;
        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
      } finally {
        this.memoryLocks.delete(lockFull);
        await this.del(lockLogical);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    const retry = await this.get<T>(key);
    if (retry !== null) return retry;
    const value = await factory();
    await this.set(key, value, ttlSeconds).catch((err) => {
      this.logger.debug(`Cache set failed for ${key}: ${(err as Error).message}`);
    });
    return value;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      hitRate: total > 0 ? Math.round((this.hits / total) * 1000) / 10 : null,
      backend: this.redis.isReady() ? 'redis' : 'memory',
    };
  }
}