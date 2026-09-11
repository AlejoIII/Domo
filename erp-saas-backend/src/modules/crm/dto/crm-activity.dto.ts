import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCrmActivityDto {
  @ApiPropertyOptional({ description: 'Código del tipo de tarea (catálogo CRM)' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;

  @ApiPropertyOptional({ description: 'ID del tipo de tarea en catálogo CRM' })
  @IsOptional()
  @IsUUID()
  taskTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  subject?: string;

  @ApiPropertyOptional({ description: 'ID del asunto preset en catálogo CRM' })
  @IsOptional()
  @IsUUID()
  subjectCatalogId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  situationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agendaClassificationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateCrmActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taskTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectCatalogId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  situationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agendaClassificationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class QueryCrmActivitiesDto {
  @ApiPropertyOptional({ description: 'Código de tipo de tarea' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  type?: string;

  @ApiPropertyOptional({ description: '1 = solo pendientes' })
  @IsOptional()
  @IsIn(['1', 'true'])
  pending?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
