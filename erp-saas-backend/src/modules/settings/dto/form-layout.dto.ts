import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min, ValidateNested, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FieldOverrideDto {
  @ApiProperty({ enum: ['text', 'email', 'integer', 'decimal', 'textarea', 'date', 'phone'] })
  @IsIn(['text', 'email', 'integer', 'decimal', 'textarea', 'date', 'phone'])
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Columnas que ocupa (1–4)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  colSpan?: number;
}

export class CustomFieldDefinitionDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty({ enum: ['text', 'email', 'integer', 'decimal', 'textarea', 'date', 'phone'] })
  @IsIn(['text', 'email', 'integer', 'decimal', 'textarea', 'date', 'phone'])
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class FormLayoutConfigDto {
  @ApiProperty({ default: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  rows!: number;

  @ApiProperty({ default: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  cols!: number;

  @ApiProperty({ description: 'cellKey (row-col) -> fieldId or null' })
  @IsObject()
  placements!: Record<string, string | null>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  overrides?: Record<string, FieldOverrideDto>;

  @ApiPropertyOptional({ type: [CustomFieldDefinitionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomFieldDefinitionDto)
  customFields?: CustomFieldDefinitionDto[];
}

export class UpdateFormLayoutDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => FormLayoutConfigDto)
  config!: FormLayoutConfigDto;
}
