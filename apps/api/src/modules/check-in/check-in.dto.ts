import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCheckInDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  qrToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  registrationCode?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(SCAN|MANUAL|CODE)$/)
  channel?: 'SCAN' | 'MANUAL' | 'CODE';
}
