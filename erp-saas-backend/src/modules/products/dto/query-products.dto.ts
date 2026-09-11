import { IsOptional, IsInt, Min, Max, IsString, IsBoolean, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProductsDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Solo productos con stock <= minStock (minStock > 0)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ enum: ['true', 'false', '1', '0'], description: 'Filtrar activo/inactivo' })
  @IsOptional()
  @IsIn(['true', 'false', '1', '0'])
  active?: string;
}
