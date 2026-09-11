import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountingPeriodQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AccountingLedgerQueryDto extends AccountingPeriodQueryDto {
  @ApiProperty({ example: '735c864c-879a-4145-979e-1ed3a7598007' })
  @IsUUID()
  accountId!: string;
}
