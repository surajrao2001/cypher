import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class StartPayoutSetupDto {
  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'contactPhone must be a 10-digit Indian mobile' })
  contactPhone!: string;
}

export class CreateCheckoutDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'customerPhone must be a 10-digit Indian mobile' })
  customerPhone!: string;
}
