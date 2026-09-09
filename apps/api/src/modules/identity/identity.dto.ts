import { IsArray, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, { message: 'Use E.164 Indian mobile: +91 followed by 10 digits' })
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, { message: 'Use E.164 Indian mobile: +91 followed by 10 digits' })
  phone!: string;

  @IsString()
  @Matches(/^\d{6,8}$/, { message: 'OTP must be 6 to 8 digits' })
  token!: string;
}

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  dancerName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  crew?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^@?[A-Za-z0-9._]+$/, { message: 'Instagram handle only' })
  instagram?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(40) dancerName?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string | null;
  @IsOptional() @IsString() @MaxLength(80) crew?: string | null;
  @IsOptional() @IsString() @MaxLength(30)
  @Matches(/^@?[A-Za-z0-9._]+$/, { message: 'Instagram handle only' })
  instagram?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) styles?: string[];
  @IsOptional() @IsString() @MaxLength(1000) bio?: string | null;
  @IsOptional() @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  avatarUrl?: string | null;
}
