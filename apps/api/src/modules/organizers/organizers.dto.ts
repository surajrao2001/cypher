import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateOrganizerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  orgName!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(independent|collective|college|studio|community|other)$/)
  type?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^@?[A-Za-z0-9._]+$/)
  instagram?: string;
}

export class UpdateOrganizerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  orgName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(independent|collective|college|studio|community|other)$/)
  type?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^@?[A-Za-z0-9._]+$/)
  instagram?: string | null;
}

export class EventCategoryInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceMinor?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  capacity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  teamSize?: number;

  @IsOptional()
  @IsString()
  @Matches(/^(solo|team|viewer)$/)
  entryType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  minTeamSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxTeamSize?: number;
}

export class UpdateEventCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  capacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  teamSize?: number;

  @IsOptional()
  @IsString()
  @Matches(/^(solo|team|viewer)$/)
  entryType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  minTeamSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  maxTeamSize?: number;
}

export class AudiencePassInputDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceMinor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  capacity?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;
}

export class CreateOrganizerEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^(battle|workshop|jam|showcase|cypher|session|camp|audition|competition|other)$/,
  )
  eventType?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  venue?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  venueLatitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  venueLongitude?: number | null;

  @IsString()
  startTime!: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  posterUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  styles?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventCategoryInputDto)
  @ArrayMaxSize(20)
  categories?: EventCategoryInputDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AudiencePassInputDto)
  audiencePass?: AudiencePassInputDto;
}

export class UpdateOrganizerEventDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @Matches(
    /^(battle|workshop|jam|showcase|cypher|session|camp|audition|competition|other)$/,
  )
  eventType?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  venue?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  venueLatitude?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  venueLongitude?: number | null;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(500)
  posterUrl?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AudiencePassInputDto)
  audiencePass?: AudiencePassInputDto;
}

export class CreateEventMediaLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(1000)
  url!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(youtube|instagram|drive|other)$/)
  kind?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class UpdateEventMediaLinkDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(1000)
  url?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(youtube|instagram|drive|other)$/)
  kind?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class EventDayInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;

  @IsString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReplaceEventDaysDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDayInputDto)
  days!: EventDayInputDto[];
}

export class CategoryPriceTierInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceMinor!: number;

  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxQuantity?: number | null;
}

export class ReplaceCategoryPriceTiersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryPriceTierInputDto)
  tiers!: CategoryPriceTierInputDto[];
}

export class SetCategoryValidDaysDto {
  @IsArray()
  @IsString({ each: true })
  dayIds!: string[];
}

export class EarlyBirdInputDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceMinorDay!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceMinorFull!: number;

  @IsString()
  endsAt!: string;
}

export class GenerateAudienceDayPassesDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  dayPriceMinor!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  fullPriceMinor!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  capacityPerDay!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000)
  fullCapacity?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => EarlyBirdInputDto)
  earlyBird?: EarlyBirdInputDto;
}
