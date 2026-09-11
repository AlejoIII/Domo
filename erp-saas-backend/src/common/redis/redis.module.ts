import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { ApiRateLimitService } from './api-rate-limit.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, ApiRateLimitService],
  exports: [RedisService, ApiRateLimitService],
})
export class RedisModule {}
