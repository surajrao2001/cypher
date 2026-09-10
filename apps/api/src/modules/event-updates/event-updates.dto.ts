import { IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateEventUpdateDto {
  @IsOptional()
  @IsString()
  @Matches(/^(GENERAL|LINEUP|MEDIA|SCHEDULE|RULES|OTHER)$/)
  kind?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(1000)
  posterUrl?: string | null;
}

export class UpdateEventUpdateDto extends CreateEventUpdateDto {
  @IsOptional()
  declare body: string;
}
