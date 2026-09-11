import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Integración ERP externo' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ required: false, example: ['clients.read', 'products.read'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
