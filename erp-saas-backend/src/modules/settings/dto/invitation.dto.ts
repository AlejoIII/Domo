import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roleId?: string;
}

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}
