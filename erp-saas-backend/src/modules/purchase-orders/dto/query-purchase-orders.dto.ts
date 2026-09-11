import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPurchaseOrdersDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['draft', 'sent', 'received', 'cancelled'] })
  @IsOptional()
  @IsIn(['draft', 'sent', 'received', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Fecha OC desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'Fecha OC hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  to?: string;
}
