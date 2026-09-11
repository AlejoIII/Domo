import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendCrmEmailDto {
  @ApiProperty()
  @IsEmail()
  to!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  bodyHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  opportunityId?: string;
}

export class SendCrmSmsDto {
  @ApiProperty()
  @IsString()
  @MaxLength(20)
  to!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(640)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  acreliaAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  opportunityId?: string;
}
