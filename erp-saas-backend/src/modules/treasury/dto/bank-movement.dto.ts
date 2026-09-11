import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBankMovementDto {
  @ApiProperty()
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty({ example: '2026-07-22' })
  @IsDateString()
  movementDate!: string;

  @ApiProperty({ example: 'Transferencia recibida' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description!: string;

  @ApiProperty({ example: 150.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: ['in', 'out'] })
  @IsIn(['in', 'out'])
  type!: 'in' | 'out';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class ImportBankMovementsDto {
  @ApiProperty()
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty({
    description: 'CSV con columnas fecha;concepto;importe (importe con signo) o fecha;concepto;importe;tipo',
  })
  @IsString()
  @MinLength(3)
  csv!: string;
}

export class ReconcileMovementDto {
  @ApiProperty()
  @IsUUID()
  paymentId!: string;
}
