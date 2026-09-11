import {
  Controller, Get, Req, UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { MetricsService, MetricsResponse } from './metrics.service';

@ApiTags('Metrics')
@SkipThrottle()
@Controller()
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly config: ConfigService,
  ) {}

  @Get('metrics')
  getMetrics(@Req() req: Request): Promise<MetricsResponse> {
    this.assertAccess(req);
    return this.metrics.getMetrics();
  }

  private assertAccess(req: Request) {
    const isProd = this.config.get('NODE_ENV') === 'production';
    const token = this.config.get<string>('METRICS_TOKEN')?.trim();

    // Desarrollo: abierto (salvo si defines METRICS_TOKEN)
    if (!isProd && !token) return;

    if (!token) {
      // Producción sin token → endpoint oculto
      throw new NotFoundException();
    }

    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    if (bearer === token || queryToken === token) return;

    throw new UnauthorizedException('Unauthorized');
  }
}
