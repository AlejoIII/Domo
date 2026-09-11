import {
  IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/webhooks/domo' })
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url!: string;

  @ApiProperty({ example: ['invoice.paid', 'order.confirmed'] })
  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  secret?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
