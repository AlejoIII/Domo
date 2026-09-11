import {
  IsString, IsOptional, IsArray, ValidateNested, MaxLength, MinLength, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InvoiceLineDto } from './invoice.dto';

export class CreateCreditNoteDto {
  @ApiProperty({
    description: 'Motivo de la rectificación (obligatorio en factura rectificativa)',
    example: 'Devolución parcial de mercancía',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ description: 'Fecha de emisión de la rectificativa' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    type: [InvoiceLineDto],
    description: 'Líneas a rectificar. Sin valor rectifica la factura completa.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines?: InvoiceLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
