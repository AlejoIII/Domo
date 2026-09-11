import {
  IsString, IsOptional, IsNumber, IsIn, Min, MaxLength, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ enum: ['cash', 'transfer', 'card', 'other'] })
  @IsOptional()
  @IsIn(['cash', 'transfer', 'card', 'other'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
