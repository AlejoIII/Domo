import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class SendDocumentEmailDto {
  @ApiPropertyOptional({ description: 'Destinatario; por defecto el email del cliente' })
  @IsOptional()
  @IsEmail()
  to?: string;
}
