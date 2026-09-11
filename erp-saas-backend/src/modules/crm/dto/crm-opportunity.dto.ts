import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuoteLineDto } from '../../quotes/dto/quote.dto';

export class CreateCrmOpportunityDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateCrmOpportunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['open', 'won', 'lost'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  lostReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class MoveCrmOpportunityStageDto {
  @ApiProperty()
  @IsUUID()
  stageId!: string;
}

export class ConvertOpportunityToQuoteDto {
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

  @ApiPropertyOptional({ type: [QuoteLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines?: QuoteLineDto[];
}

export class QueryCrmOpportunitiesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['open', 'won', 'lost'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
