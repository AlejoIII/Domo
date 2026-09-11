import { IsBoolean, IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Mi Empresa SL' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: 'admin@miempresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'miPassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @ApiPropertyOptional({ description: 'Token de invitación beta (obligatorio si REGISTRATION_MODE=invite_only)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  inviteToken?: string;

  @ApiProperty({ description: 'Aceptación de términos y privacidad' })
  @IsBoolean()
  acceptedTerms!: boolean;
}
