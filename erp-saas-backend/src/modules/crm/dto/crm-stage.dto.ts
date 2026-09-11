import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCrmStageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: '#6366f1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ enum: ['won', 'lost'] })
  @IsOptional()
  @IsIn(['won', 'lost'])
  outcome?: 'won' | 'lost' | null;
}

export class UpdateCrmStageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({ enum: ['won', 'lost'] })
  @IsOptional()
  @IsIn(['won', 'lost'])
  outcome?: 'won' | 'lost' | null;
}

export class ReorderCrmStageItemDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderCrmStagesDto {
  @ApiProperty({ type: [ReorderCrmStageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderCrmStageItemDto)
  stages!: ReorderCrmStageItemDto[];
}
