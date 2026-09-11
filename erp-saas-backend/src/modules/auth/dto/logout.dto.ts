import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({ description: 'Refresh token de la sesión a cerrar' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
