import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportPeriodDto } from './report-period.dto';

export class ReportExportQueryDto extends ReportPeriodDto {
  @ApiPropertyOptional({ enum: ['csv', 'xlsx'], default: 'csv' })
  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';
}
