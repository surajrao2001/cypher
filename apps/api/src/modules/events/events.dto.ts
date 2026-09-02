import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed === 'all' ? undefined : trimmed;
}

export class EventDiscoveryQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  style?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;
}

export function normalizeDiscoveryQuery(query: EventDiscoveryQueryDto): {
  q?: string;
  city?: string;
  tag?: string;
  type?: string;
  page: number;
  pageSize: number;
} {
  const tag = emptyToUndefined(query.tag) ?? emptyToUndefined(query.style);
  return {
    q: emptyToUndefined(query.q) as string | undefined,
    city: emptyToUndefined(query.city) as string | undefined,
    tag: tag as string | undefined,
    type: emptyToUndefined(query.type) as string | undefined,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  };
}
