import { z } from 'zod';

/**
 * Shared G1 event-day request/response validation (Zod).
 * Mirrors `@cypher/contracts` shapes; Nest class-validator DTOs land with Checkpoint 3 routes.
 */

function asDate(value: Date | string | null | undefined, label: string): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return d;
}

/**
 * Window relationship rules for a *merged* effective config.
 *
 * - checkInOpensAt < checkInClosesAt when both set
 * - if earlyCheckInEndsAt set: both open and close MUST exist, and
 *   checkInOpensAt < earlyCheckInEndsAt <= checkInClosesAt
 */
export function assertEventDayWindows(input: {
  checkInOpensAt?: Date | string | null;
  earlyCheckInEndsAt?: Date | string | null;
  checkInClosesAt?: Date | string | null;
}): void {
  const opens = asDate(input.checkInOpensAt ?? null, 'checkInOpensAt');
  const early = asDate(input.earlyCheckInEndsAt ?? null, 'earlyCheckInEndsAt');
  const closes = asDate(input.checkInClosesAt ?? null, 'checkInClosesAt');

  if (opens && closes && !(opens.getTime() < closes.getTime())) {
    throw new Error('Check-in open must be before close');
  }

  if (early) {
    if (!opens) {
      throw new Error('Early check-in end requires check-in opening');
    }
    if (!closes) {
      throw new Error('Early check-in end requires check-in closing');
    }
    if (!(opens.getTime() < early.getTime())) {
      throw new Error('Early check-in end must be after check-in opens');
    }
    if (early.getTime() > closes.getTime()) {
      throw new Error('Early check-in end must be on or before check-in closes');
    }
  }
}

/** Reject non-IANA values using the runtime zone database (no hardcoded allow-list). */
export function assertIanaTimezone(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Timezone is required');
  }
  // Prefer canonical Area/Location (or UTC / Etc/*). Reject bare abbreviations like "IST".
  const looksCanonical =
    trimmed === 'UTC' || trimmed === 'GMT' || trimmed.startsWith('Etc/') || trimmed.includes('/');
  if (!looksCanonical) {
    throw new Error('Timezone must be a valid IANA timezone');
  }
  try {
    Intl.DateTimeFormat('en-US', { timeZone: trimmed });
  } catch {
    throw new Error('Timezone must be a valid IANA timezone');
  }
}

/** ISO-8601 instant with offset (matches existing organizer event schemas). */
export const isoDateTimeStringSchema = z.string().datetime({ offset: true });

/**
 * Basic IANA-shaped timezone string plus runtime Intl verification.
 * Do not treat the regex alone as authoritative.
 */
export const ianaTimezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_+\-/]+$/, 'Timezone must be an IANA-shaped string')
  .superRefine((value, ctx) => {
    try {
      assertIanaTimezone(value);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : 'Invalid timezone',
      });
    }
  });

export const eventOpsStatusSchema = z.enum([
  'scheduled',
  'check_in_open',
  'check_in_closed',
  'event_live',
  'completed',
]);

const nullableIsoDateTime = z.union([isoDateTimeStringSchema, z.null()]);

export const patchEventDayConfigBodySchema = z
  .object({
    timezone: ianaTimezoneSchema.optional(),
    /** Omitted = unchanged; `null` = clear. */
    checkInOpensAt: nullableIsoDateTime.optional(),
    earlyCheckInEndsAt: nullableIsoDateTime.optional(),
    checkInClosesAt: nullableIsoDateTime.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    try {
      assertEventDayWindows(data);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : 'Invalid check-in windows',
      });
    }
  });

export const setEventOpsStatusBodySchema = z
  .object({
    opsStatus: eventOpsStatusSchema,
  })
  .strict();

export const eventDayConfigDtoSchema = z
  .object({
    eventId: z.string().uuid(),
    timezone: ianaTimezoneSchema,
    checkInOpensAt: nullableIsoDateTime,
    earlyCheckInEndsAt: nullableIsoDateTime,
    checkInClosesAt: nullableIsoDateTime,
    opsStatus: eventOpsStatusSchema,
  })
  .strict();

export const eventDayProgressionDtoSchema = z
  .object({
    attendanceXp: z.number().int().min(0),
    earlyCheckInXp: z.number().int().min(0),
    totalEventDayXp: z.number().int().min(0),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.totalEventDayXp !== data.attendanceXp + data.earlyCheckInXp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'totalEventDayXp must equal attendanceXp + earlyCheckInXp',
        path: ['totalEventDayXp'],
      });
    }
  });

export const eventLiveEntryDtoSchema = z
  .object({
    registrationId: z.string().uuid(),
    categoryId: z.string().uuid(),
    categoryName: z.string().min(1).max(120),
    entryType: z.enum(['solo', 'team', 'viewer']),
    checkedIn: z.boolean(),
    checkedInAt: nullableIsoDateTime,
  })
  .strict();

const eventUpdateDtoSchema = z
  .object({
    id: z.string().uuid(),
    eventId: z.string().uuid(),
    authorUserId: z.string().uuid(),
    kind: z.enum(['GENERAL', 'LINEUP', 'MEDIA', 'SCHEDULE', 'RULES', 'OTHER']),
    title: z.string().nullable(),
    body: z.string(),
    posterUrl: z.string().nullable(),
    publishedAt: isoDateTimeStringSchema,
    createdAt: isoDateTimeStringSchema,
    updatedAt: isoDateTimeStringSchema,
  })
  .strict();

export const eventLiveDtoSchema = z
  .object({
    eventId: z.string().uuid(),
    ops: z
      .object({
        status: eventOpsStatusSchema,
        timezone: ianaTimezoneSchema,
      })
      .strict(),
    checkIn: z
      .object({
        opensAt: nullableIsoDateTime,
        earlyEndsAt: nullableIsoDateTime,
        closesAt: nullableIsoDateTime,
        attendanceVerified: z.boolean(),
        earlyCheckInEarned: z.boolean(),
        myEntries: z.array(eventLiveEntryDtoSchema),
      })
      .strict(),
    progression: eventDayProgressionDtoSchema,
    announcements: z.array(eventUpdateDtoSchema),
  })
  .strict();

export const checkInDtoSchema = z
  .object({
    id: z.string().uuid(),
    eventId: z.string().uuid(),
    registrationId: z.string().uuid(),
    checkedInAt: isoDateTimeStringSchema,
    checkedInByUserId: z.string().uuid(),
    channel: z.enum(['SCAN', 'MANUAL', 'CODE']),
    registrationCode: z.string().optional(),
    entryName: z.string().nullable().optional(),
    dancerName: z.string().nullable().optional(),
    progression: eventDayProgressionDtoSchema.optional(),
  })
  .strict();

export type PatchEventDayConfigBodyInput = z.infer<typeof patchEventDayConfigBodySchema>;
export type SetEventOpsStatusBodyInput = z.infer<typeof setEventOpsStatusBodySchema>;
export type EventDayConfigDtoInput = z.infer<typeof eventDayConfigDtoSchema>;
export type EventLiveDtoInput = z.infer<typeof eventLiveDtoSchema>;
export type EventDayProgressionDtoInput = z.infer<typeof eventDayProgressionDtoSchema>;
