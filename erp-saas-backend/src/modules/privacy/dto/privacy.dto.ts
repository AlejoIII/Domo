import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnonymizeClientDto {
  @ApiPropertyOptional({ description: 'Motivo de la solicitud de supresión (RGPD art. 17)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class DeleteCompanyDataDto {
  @ApiProperty({
    description: 'Nombre exacto de la empresa como confirmación',
    example: 'Mi Empresa SL',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  confirmation!: string;

  @ApiPropertyOptional({ description: 'Motivo de la baja' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
