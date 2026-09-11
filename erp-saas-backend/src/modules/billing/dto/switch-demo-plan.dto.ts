import { IsIn, IsString } from 'class-validator';

export class SwitchDemoPlanDto {
  @IsString()
  @IsIn(['free', 'pro', 'enterprise'])
  planCode!: string;
}
