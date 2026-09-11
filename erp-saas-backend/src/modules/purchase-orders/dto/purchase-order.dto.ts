import {
  IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested,
  IsIn, Min, MaxLength, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PurchaseOrderLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @ApiProperty()
  @IsUUID()
  supplierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'sent', 'received', 'cancelled'] })
  @IsOptional()
  @IsIn(['draft', 'sent', 'received', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ default: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'sent', 'received', 'cancelled'] })
  @IsOptional()
  @IsIn(['draft', 'sent', 'received', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ type: [PurchaseOrderLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines?: PurchaseOrderLineDto[];
}
