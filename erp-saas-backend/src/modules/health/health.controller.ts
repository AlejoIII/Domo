import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService, HealthStatusResponse } from './health.service';

@ApiTags('Health')
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  health() {
    return this.healthService.health();
  }

  @Get('version')
  version() {
    return this.healthService.version();
  }

  @Get('status')
  async status(): Promise<HealthStatusResponse> {
    return this.healthService.status();
  }

  @Get('status/public')
  publicStatus() {
    return this.healthService.publicStatus();
  }
}
