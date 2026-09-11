import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientNoteDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  text!: string;
}
