import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CRM_CATALOG_CATEGORIES } from '../crm-config.constants';

export class CreateCrmCatalogItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCrmCatalogItemDto extends CreateCrmCatalogItemDto {}

export class QueryCrmCatalogDto {
  @ApiProperty({ enum: CRM_CATALOG_CATEGORIES })
  @IsIn([...CRM_CATALOG_CATEGORIES])
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateCrmEmailTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  bodyHtml!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCrmEmailTemplateDto extends CreateCrmEmailTemplateDto {}

export class CreateCrmSmsTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(640)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCrmSmsTemplateDto extends CreateCrmSmsTemplateDto {}

export class UpdateCrmEmailSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  copyTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultEmailTemplateId?: string;
}

export class CreateCrmAcreliaAccountDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  senderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateCrmAcreliaAccountDto extends CreateCrmAcreliaAccountDto {}
