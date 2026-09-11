import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Opcional si se envía la cookie domo_rt' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
