import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyPlanDto {
  @ApiProperty({ example: 'pro' })
  @IsString()
  planCode!: string;
}

export class UpdateCompanyTrialDto {
  @ApiProperty({ example: '2026-08-22T00:00:00.000Z' })
  @IsDateString()
  trialEndsAt!: string;
}

export class UpdateCompanyNotesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  platformNotes?: string;
}

export class ImpersonateDto {
  @ApiPropertyOptional({ description: 'Usuario concreto; si no, el primer admin activo' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class UpdatePlatformUserStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class UpdateMaintenanceDto {
  @ApiProperty()
  @IsBoolean()
  maintenanceMode!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  maintenanceMessage?: string;
}

export class CreateBetaInviteDto {
  @ApiPropertyOptional({ example: 'cliente@empresa.com' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ example: 'beta-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateRegistrationSettingsDto {
  @ApiPropertyOptional({ enum: ['open', 'invite_only'] })
  @IsOptional()
  @IsIn(['open', 'invite_only'])
  registrationMode?: 'open' | 'invite_only';

  @ApiPropertyOptional({ description: 'null = sin límite', nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsInt()
  @Min(1)
  betaSignupCap?: number | null;
}
