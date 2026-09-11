import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PlanFeatureGuard } from '../../common/guards/plan-feature.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequirePlanFeature } from '../../common/decorators/plan-feature.decorator';
import { AccountingChartService } from './accounting-chart.service';
import { AccountingReportsService } from './accounting-reports.service';
import { AccountingPeriodQueryDto, AccountingLedgerQueryDto } from './dto/accounting-period.dto';

@ApiTags('Accounting')
@ApiBearerAuth()
@RequirePlanFeature('accounting')
@UseGuards(JwtAuthGuard, PermissionsGuard, PlanFeatureGuard)
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly chart: AccountingChartService,
    private readonly reports: AccountingReportsService,
  ) {}

  @Get('accounts')
  @RequirePermissions('accounting.read')
  listAccounts(@CurrentUser('companyId') companyId: string) {
    return this.chart.listAccounts(companyId);
  }

  @Get('journal')
  @RequirePermissions('accounting.read')
  journal(
    @CurrentUser('companyId') companyId: string,
    @Query() query: AccountingPeriodQueryDto,
  ) {
    return this.reports.getJournal(companyId, query.from, query.to);
  }

  @Get('journal/export')
  @RequirePermissions('accounting.read')
  async exportJournal(
    @CurrentUser('companyId') companyId: string,
    @Query() query: AccountingPeriodQueryDto,
    @Res() res: Response,
  ) {
    const entries = await this.reports.getJournal(companyId, query.from, query.to);
    const csv = this.reports.buildJournalCsv(entries);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="libro_diario_${stamp}.csv"`);
    res.send(csv);
  }

  @Get('ledger')
  @RequirePermissions('accounting.read')
  ledger(
    @CurrentUser('companyId') companyId: string,
    @Query() query: AccountingLedgerQueryDto,
  ) {
    return this.reports.getLedger(companyId, query.accountId, query.from, query.to);
  }

  @Get('trial-balance')
  @RequirePermissions('accounting.read')
  trialBalance(
    @CurrentUser('companyId') companyId: string,
    @Query() query: AccountingPeriodQueryDto,
  ) {
    return this.reports.getTrialBalance(companyId, query.from, query.to);
  }
}
