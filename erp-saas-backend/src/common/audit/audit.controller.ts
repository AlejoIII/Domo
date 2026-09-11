import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { RequireAdmin } from '../decorators/admin.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequireAdmin()
  @RequirePermissions('settings.read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.auditService.findAll(companyId, p, l).then(([items, total]) => ({
      items,
      meta: { total, page: p, limit: l, totalPages: Math.ceil(total / l) },
    }));
  }
}
