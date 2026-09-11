import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateNavigationPrefsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemOrder?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hiddenIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  childOrder?: Record<string, string[]>;
}
