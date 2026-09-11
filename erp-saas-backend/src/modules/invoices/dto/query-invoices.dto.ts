import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInvoicesDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['draft', 'issued', 'partially_paid', 'paid', 'credited', 'cancelled'] })
  @IsOptional()
  @IsIn(['draft', 'issued', 'partially_paid', 'paid', 'credited', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({
    enum: ['invoice', 'credit_note'],
    description: 'Sin valor devuelve facturas y rectificativas',
  })
  @IsOptional()
  @IsIn(['invoice', 'credit_note'])
  documentType?: string;

  @ApiPropertyOptional({ description: '1 = solo facturas vencidas con saldo pendiente' })
  @IsOptional()
  @IsIn(['1', 'true'])
  overdue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
