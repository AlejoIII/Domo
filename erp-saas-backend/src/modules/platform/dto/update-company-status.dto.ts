import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyStatusDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isActive!: boolean;
}
