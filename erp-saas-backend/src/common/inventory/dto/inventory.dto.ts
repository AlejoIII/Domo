import {
  IsInt, IsOptional, IsString, IsUUID, MaxLength, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryStockMovementsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: ['in', 'out', 'adjustment', 'transfer'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'sales_order | purchase_order | manual | transfer' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Busca en producto, almacén o notas' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class CreateStockTransferDto {
  @ApiProperty()
  @IsUUID()
  fromWarehouseId!: string;

  @ApiProperty()
  @IsUUID()
  toWarehouseId!: string;

  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AdjustWarehouseStockDto {
  @ApiPropertyOptional()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class StockValuationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}
