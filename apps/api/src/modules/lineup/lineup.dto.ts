import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
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

export class LineupPersonDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^(judge|choreographer|instructor|dj|emcee|guest|performer|other)$/)
  role!: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  instagram?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  blurb?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class ReplaceLineupDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupPersonDto)
  people!: LineupPersonDto[];

  @IsOptional()
  @IsBoolean()
  announce?: boolean;
}
