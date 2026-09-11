import {
  IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested,
  IsIn, Min, MaxLength, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DocumentLineDto {
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

export class CreateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled', 'invoiced'] })
  @IsOptional()
  @IsIn(['draft', 'confirmed', 'shipped', 'delivered', 'cancelled', 'invoiced'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  deliveryNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string;

  @ApiPropertyOptional({ default: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiProperty({ type: [DocumentLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  lines!: DocumentLineDto[];
}

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled', 'invoiced'] })
  @IsOptional()
  @IsIn(['draft', 'confirmed', 'shipped', 'delivered', 'cancelled', 'invoiced'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  deliveryNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ type: [DocumentLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentLineDto)
  lines?: DocumentLineDto[];
}
