import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateVerifactuSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: ['verifactu', 'no_verificable'] })
  @IsOptional()
  @IsIn(['verifactu', 'no_verificable'])
  mode?: 'verifactu' | 'no_verificable';

  @ApiPropertyOptional({ description: 'NIF emisor (si distinto del taxId de la empresa)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nif?: string;

  @ApiPropertyOptional({ description: 'PEM o PKCS#12 en base64/texto (se cifra en reposo)' })
  @IsOptional()
  @IsString()
  @MinLength(32)
  certificatePem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificatePassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clearCertificate?: boolean;
}
