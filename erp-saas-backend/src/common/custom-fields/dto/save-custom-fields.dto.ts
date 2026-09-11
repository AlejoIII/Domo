import { IsObject, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SaveCustomFieldsDto {
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  values?: Record<string, unknown>;
}
