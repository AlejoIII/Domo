import {
  Controller, Get, HttpCode, Param, Query, Res, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportPeriodDto } from './dto/report-period.dto';
import { ReportExportQueryDto } from './dto/report-export.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PlanFeatureGuard } from '../../common/guards/plan-feature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequirePlanFeature } from '../../common/decorators/plan-feature.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@RequirePlanFeature('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermissions('reports.read')
  sales(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ReportPeriodDto,
  ) {
    return this.reportsService.sales(companyId, query);
  }

  @Get('sales/export')
  @RequirePermissions('reports.read')
  @HttpCode(202)
  exportSales(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ReportExportQueryDto,
  ) {
    return this.reportsService.enqueueSalesExport(companyId, query);
  }

  @Get('finance')
  @RequirePermissions('reports.read')
  finance(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ReportPeriodDto,
  ) {
    return this.reportsService.finance(companyId, query);
  }

  @Get('finance/export')
  @RequirePermissions('reports.read')
  @HttpCode(202)
  exportFinance(
    @CurrentUser('companyId') companyId: string,
    @Query() query: ReportExportQueryDto,
  ) {
    return this.reportsService.enqueueFinanceExport(companyId, query);
  }

  @Get('exports/:jobId')
  @RequirePermissions('reports.read')
  exportStatus(
    @CurrentUser('companyId') companyId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.reportsService.getExportStatus(jobId, companyId);
  }

  @Get('exports/:jobId/download')
  @RequirePermissions('reports.read')
  async downloadExport(
    @CurrentUser('companyId') companyId: string,
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ) {
    const { meta, content } = await this.reportsService.readExportFile(jobId, companyId);
    res.setHeader('Content-Type', meta.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.fileName}"`);
    res.send(content);
  }
}
