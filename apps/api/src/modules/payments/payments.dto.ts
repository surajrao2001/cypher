import { IsEmail, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';

export class StartPayoutSetupDto {
  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'contactPhone must be a 10-digit Indian mobile' })
  contactPhone!: string;

  /** Organizer PAN for Cashfree Easy Split KYC. */
  @IsString()
  @Matches(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/, { message: 'pan must be a valid 10-character PAN' })
  pan!: string;

  /** Bank account for settlements. Optional in sandbox (test bank is applied). */
  @IsOptional()
  @IsString()
  @MinLength(5)
  bankAccountNumber?: string;

  @ValidateIf((body: StartPayoutSetupDto) => Boolean(body.bankAccountNumber?.trim()))
  @IsString()
  @MinLength(2)
  bankAccountHolder?: string;

  @ValidateIf((body: StartPayoutSetupDto) => Boolean(body.bankAccountNumber?.trim()))
  @IsString()
  @Matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, { message: 'bankIfsc must be a valid IFSC' })
  bankIfsc?: string;

  /** Optional UPI VPA instead of / in addition to bank. */
  @IsOptional()
  @IsString()
  @Matches(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/, { message: 'upiVpa must look like name@bank' })
  upiVpa?: string;
}

export class CreateCheckoutDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'customerPhone must be a 10-digit Indian mobile' })
  customerPhone!: string;
}

export class ReconcileCashfreeOrderDto {
  @IsString()
  @MinLength(3)
  orderId!: string;
}
