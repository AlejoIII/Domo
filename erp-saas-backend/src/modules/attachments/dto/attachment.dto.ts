import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ATTACHMENT_ENTITY_TYPES, AttachmentEntityType } from '../attachment-entities.constants';

export class CreateAttachmentDto {
  @ApiProperty({ enum: ATTACHMENT_ENTITY_TYPES })
  @IsIn(ATTACHMENT_ENTITY_TYPES)
  entityType!: AttachmentEntityType;

  @ApiProperty()
  @IsUUID()
  entityId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  fileUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;
}

export class QueryAttachmentsDto {
  @ApiProperty({ enum: ATTACHMENT_ENTITY_TYPES })
  @IsIn(ATTACHMENT_ENTITY_TYPES)
  entityType!: AttachmentEntityType;

  @ApiProperty()
  @IsUUID()
  entityId!: string;
}
