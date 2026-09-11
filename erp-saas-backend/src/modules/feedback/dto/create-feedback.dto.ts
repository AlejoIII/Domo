import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'El flujo de facturas es confuso al crear la primera.' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: '/invoices/new' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  page?: string;
}
