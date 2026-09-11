import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryOrdersDto {
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

  @ApiPropertyOptional({
    enum: ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled', 'invoiced'],
  })
  @IsOptional()
  @IsIn(['draft', 'confirmed', 'shipped', 'delivered', 'cancelled', 'invoiced'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Fecha pedido desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'Fecha pedido hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  to?: string;
}
