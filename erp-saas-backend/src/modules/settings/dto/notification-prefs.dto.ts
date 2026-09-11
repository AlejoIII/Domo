import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOrders?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyInvoices?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifySystem?: boolean;
}
