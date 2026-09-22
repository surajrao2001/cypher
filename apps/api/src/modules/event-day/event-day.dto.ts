import { IsISO8601, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/** Thin Nest adapter — canonical shape is PatchEventDayConfigBody in @cypher/contracts. */
export class PatchEventDayConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  /** Omitted = unchanged; null = clear. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsISO8601({ strict: true })
  checkInOpensAt?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsISO8601({ strict: true })
  earlyCheckInEndsAt?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsISO8601({ strict: true })
  checkInClosesAt?: string | null;
}

/** Thin Nest adapter — canonical shape is SetEventOpsStatusBody in @cypher/contracts. */
export class SetEventOpsStatusDto {
  @IsString()
  @Matches(/^(scheduled|check_in_open|check_in_closed|event_live|completed)$/)
  opsStatus!: string;
}
