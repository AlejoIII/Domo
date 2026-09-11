import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingChartService } from './accounting-chart.service';
import { AccountingPostingService } from './accounting-posting.service';
import { AccountingReportsService } from './accounting-reports.service';

@Module({
  controllers: [AccountingController],
  providers: [AccountingChartService, AccountingPostingService, AccountingReportsService],
  exports: [AccountingPostingService, AccountingChartService],
})
export class AccountingModule {}
