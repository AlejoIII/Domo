import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportPeriodDto {
  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
