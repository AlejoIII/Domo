import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ImportCsvDto {
  @ApiProperty({ description: 'Contenido CSV con cabecera en la primera fila' })
  @IsString()
  @MinLength(1)
  @MaxLength(2_000_000)
  csv!: string;

  @ApiPropertyOptional({ description: 'Si true, solo valida sin persistir' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  dryRun?: boolean;
}

export class ImportProductsCsvDto extends ImportCsvDto {
  @ApiPropertyOptional({
    description: 'Código de almacén por defecto cuando la fila no indica almacen',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultWarehouseCode?: string;
}
