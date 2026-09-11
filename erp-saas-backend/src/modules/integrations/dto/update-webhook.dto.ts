import {
  IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  secret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
