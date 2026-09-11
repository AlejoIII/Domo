import {
  IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested,
  IsIn, Min, MaxLength, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuoteLineDto {
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

export class CreateQuoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @ApiProperty()
  @IsUUID()
  clientId!: string;

  @ApiPropertyOptional({ enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'] })
  @IsOptional()
  @IsIn(['draft', 'sent', 'accepted', 'rejected', 'expired'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  quoteDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

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

  @ApiProperty({ type: [QuoteLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines!: QuoteLineDto[];
}

export class UpdateQuoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'] })
  @IsOptional()
  @IsIn(['draft', 'sent', 'accepted', 'rejected', 'expired'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  quoteDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

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

  @ApiPropertyOptional({ type: [QuoteLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines?: QuoteLineDto[];
}
