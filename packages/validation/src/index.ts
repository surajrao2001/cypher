import { z } from 'zod';

export type GateTier = {
  name: string;
  priceMinor: number;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

export type GateDay = {
  label: string;
  startsAt: Date | string;
  endsAt?: Date | string | null;
};

function asDate(value: Date | string | null | undefined, label: string): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return d;
}

export function assertEndAfterStart(
  startTime: Date | string,
  endTime: Date | string | null | undefined,
): void {
  if (endTime == null || endTime === '') return;
  const start = asDate(startTime, 'startTime')!;
  const end = asDate(endTime, 'endTime')!;
  if (end.getTime() < start.getTime()) {
    throw new Error('End time must be on or after start time');
  }
}

export function assertRegistrationWindow(input: {
  opensAt?: Date | string | null;
  closesAt?: Date | string | null;
  startTime: Date | string;
}): void {
  const start = asDate(input.startTime, 'startTime')!;
  const opens = asDate(input.opensAt ?? null, 'registrationOpensAt');
  const closes = asDate(input.closesAt ?? null, 'registrationClosesAt');
  if (opens && closes && opens.getTime() > closes.getTime()) {
    throw new Error('Registration open must be before close');
  }
  if (closes && closes.getTime() > start.getTime()) {
    throw new Error('Registration must close before the event starts');
  }
  if (opens && opens.getTime() > start.getTime()) {
    throw new Error('Registration cannot open after the event starts');
  }
}

export function assertEventDaysInSpan(
  days: GateDay[],
  eventStart: Date | string,
  eventEnd: Date | string | null | undefined,
): void {
  const start = asDate(eventStart, 'startTime')!;
  const end = eventEnd != null && eventEnd !== '' ? asDate(eventEnd, 'endTime') : null;
  for (const day of days) {
    const dayStart = asDate(day.startsAt, `day "${day.label}" start`)!;
    const dayEnd = asDate(day.endsAt ?? null, `day "${day.label}" end`);
    if (dayEnd && dayEnd.getTime() < dayStart.getTime()) {
      throw new Error(`Day "${day.label}" end must be on or after its start`);
    }
    if (dayStart.getTime() < start.getTime()) {
      throw new Error(`Day "${day.label}" starts before the event`);
    }
    if (end && dayStart.getTime() > end.getTime()) {
      throw new Error(`Day "${day.label}" starts after the event ends`);
    }
    if (end && dayEnd && dayEnd.getTime() > end.getTime()) {
      throw new Error(`Day "${day.label}" ends after the event`);
    }
  }
}

export function assertCategoryPriceTiers(
  tiers: GateTier[],
  event: { startTime: Date | string; createdAt?: Date | string | null; publishedAt?: Date | string | null },
): void {
  if (tiers.length === 0) return;
  for (const tier of tiers) {
    if (tier.priceMinor < 0) {
      throw new Error('Tier prices cannot be negative');
    }
    const starts = asDate(tier.startsAt ?? null, `${tier.name} startsAt`);
    const ends = asDate(tier.endsAt ?? null, `${tier.name} endsAt`);
    if (starts && ends && ends.getTime() < starts.getTime()) {
      throw new Error(`"${tier.name}" ends before it starts`);
    }
  }

  const eventStart = asDate(event.startTime, 'startTime')!;
  const floor =
    asDate(event.publishedAt ?? null, 'publishedAt') ??
    asDate(event.createdAt ?? null, 'createdAt');

  const early = tiers.find((t) => /early/i.test(t.name));
  const regular =
    tiers.find((t) => /regular/i.test(t.name)) ??
    tiers.find((t) => early && t.name !== early.name);

  if (early) {
    const earlyEnds = asDate(early.endsAt ?? null, 'early bird endsAt');
    if (!earlyEnds) {
      throw new Error('Early bird needs an end time');
    }
    if (earlyEnds.getTime() >= eventStart.getTime()) {
      throw new Error('Early bird must end before the event starts');
    }
    if (floor && earlyEnds.getTime() < floor.getTime()) {
      throw new Error('Early bird end must be after the event was created/published');
    }
    if (regular) {
      const regStarts = asDate(regular.startsAt ?? null, 'regular startsAt');
      if (regStarts && regStarts.getTime() !== earlyEnds.getTime()) {
        throw new Error('Regular pricing should start when early bird ends');
      }
      if (early.priceMinor > regular.priceMinor) {
        throw new Error('Early bird price should be at or below regular');
      }
    }
  }

  for (const tier of tiers) {
    const ends = asDate(tier.endsAt ?? null, `${tier.name} endsAt`);
    if (ends && ends.getTime() > eventStart.getTime()) {
      throw new Error(`"${tier.name}" cannot end after the event starts`);
    }
    const starts = asDate(tier.startsAt ?? null, `${tier.name} startsAt`);
    if (starts && starts.getTime() > eventStart.getTime()) {
      throw new Error(`"${tier.name}" cannot start after the event starts`);
    }
  }
}

export function assertTeamSizes(minTeamSize: number, maxTeamSize: number, entryType?: string): void {
  if (entryType === 'viewer') {
    if (minTeamSize !== 1 || maxTeamSize !== 1) {
      throw new Error('Viewer tickets are always 1 person');
    }
    return;
  }
  if (minTeamSize < 1 || maxTeamSize < 1) {
    throw new Error('Team size must be at least 1');
  }
  if (minTeamSize > maxTeamSize) {
    throw new Error('Min team size cannot exceed max');
  }
  if (entryType === 'solo' && (minTeamSize !== 1 || maxTeamSize !== 1)) {
    throw new Error('Solo categories are always 1 person');
  }
}

export function assertCapacityFloor(capacity: number, occupied: number): void {
  if (capacity < occupied) {
    throw new Error(`Capacity cannot be below ${String(occupied)} occupied spots`);
  }
}

export function assertPublishCategories(
  _categories: Array<{ entryType: string }>,
): void {
  // Categories are optional at publish — free sessions / announcement nights
  // can go live without compete or viewer lanes. Registration stays gated by
  // whatever categories exist later.
  void _categories;
}

export const indianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Use E.164 Indian mobile: +91 followed by 10 digits');

export const requestOtpSchema = z.object({
  phone: indianPhoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: indianPhoneSchema,
  token: z.string().regex(/^\d{6,8}$/, 'OTP must be 6 to 8 digits'),
});

export const onboardingSchema = z.object({
  dancerName: z.string().trim().min(2).max(40),
  city: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(80).optional(),
  crew: z.string().trim().min(1).max(80).optional(),
  styles: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  instagram: z
    .string()
    .trim()
    .max(30)
    .regex(/^@?[A-Za-z0-9._]+$/, 'Instagram handle only')
    .optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const eventDiscoveryQuerySchema = paginationQuerySchema.extend({
  city: z.string().min(1).max(80).optional(),
  style: z.string().min(1).max(40).optional(),
  tag: z.string().min(1).max(40).optional(),
  type: z.string().min(1).max(40).optional(),
  q: z.string().min(1).max(80).optional(),
});

export const createOrganizerSchema = z.object({
  orgName: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')
    .optional(),
  type: z.enum(['independent', 'collective', 'college', 'studio', 'community', 'other']).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  instagram: z
    .string()
    .trim()
    .max(30)
    .regex(/^@?[A-Za-z0-9._]+$/)
    .optional(),
});

export const updateOrganizerSchema = z.object({
  orgName: z.string().trim().min(2).max(80).optional(),
  type: z.enum(['independent', 'collective', 'college', 'studio', 'community', 'other']).optional(),
  city: z.string().trim().min(2).max(80).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  instagram: z
    .string()
    .trim()
    .max(30)
    .regex(/^@?[A-Za-z0-9._]+$/)
    .nullable()
    .optional(),
});

const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  priceMinor: z.number().int().min(0).max(10_000_000).optional(),
  capacity: z.number().int().min(1).max(100_000),
  entryType: z.enum(['solo', 'team']).optional(),
  minTeamSize: z.number().int().min(1).max(50).optional(),
  maxTeamSize: z.number().int().min(1).max(50).optional(),
  teamSize: z.number().int().min(1).max(50).optional(),
  posterUrl: z.string().url().max(500).nullable().optional(),
});

export const createOrganizerEventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().max(5000).optional(),
  eventType: z
    .enum([
      'battle',
      'workshop',
      'jam',
      'showcase',
      'cypher',
      'session',
      'camp',
      'audition',
      'competition',
      'other',
    ])
    .optional(),
  city: z.string().trim().min(2).max(80),
  venue: z.string().trim().max(160).optional(),
  venueLatitude: z.number().min(-90).max(90).nullable().optional(),
  venueLongitude: z.number().min(-180).max(180).nullable().optional(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }).optional(),
  registrationOpensAt: z.string().datetime({ offset: true }).nullable().optional(),
  registrationClosesAt: z.string().datetime({ offset: true }).nullable().optional(),
  posterUrl: z.string().url().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  styles: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  categories: z.array(categoryInputSchema).min(1).max(20).optional(),
}).superRefine((data, ctx) => {
  try {
    assertEndAfterStart(data.startTime, data.endTime);
    assertRegistrationWindow({
      opensAt: data.registrationOpensAt,
      closesAt: data.registrationClosesAt,
      startTime: data.startTime,
    });
  } catch (err) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err instanceof Error ? err.message : 'Invalid event times',
    });
  }
});

export const updateOrganizerEventSchema = z
  .object({
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    eventType: z
      .enum([
        'battle',
        'workshop',
        'jam',
        'showcase',
        'cypher',
        'session',
        'camp',
        'audition',
        'competition',
        'other',
      ])
      .optional(),
    city: z.string().trim().min(2).max(80).optional(),
    venue: z.string().trim().max(160).nullable().optional(),
    venueLatitude: z.number().min(-90).max(90).nullable().optional(),
    venueLongitude: z.number().min(-180).max(180).nullable().optional(),
    startTime: z.string().datetime({ offset: true }).optional(),
    endTime: z.string().datetime({ offset: true }).nullable().optional(),
    registrationOpensAt: z.string().datetime({ offset: true }).nullable().optional(),
    registrationClosesAt: z.string().datetime({ offset: true }).nullable().optional(),
    posterUrl: z.string().url().max(500).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    styles: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    featured: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime) {
      try {
        assertEndAfterStart(data.startTime, data.endTime);
      } catch (err) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: err instanceof Error ? err.message : 'Invalid event times',
        });
      }
    }
  });

export const categoryPriceTierSchema = z.object({
  name: z.string().trim().min(1).max(80),
  priceMinor: z.number().int().min(0).max(10_000_000),
  startsAt: z.string().datetime({ offset: true }).nullable().optional(),
  endsAt: z.string().datetime({ offset: true }).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  maxQuantity: z.number().int().min(1).max(100_000).nullable().optional(),
});

export const replaceCategoryPriceTiersSchema = z.object({
  tiers: z.array(categoryPriceTierSchema).max(20),
});

export const upsertEventCategorySchema = categoryInputSchema.superRefine((data, ctx) => {
  try {
    assertTeamSizes(
      data.minTeamSize ?? data.teamSize ?? 1,
      data.maxTeamSize ?? data.teamSize ?? data.minTeamSize ?? 1,
      data.entryType,
    );
  } catch (err) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err instanceof Error ? err.message : 'Invalid team size',
    });
  }
});

export type EventDiscoveryQuery = z.infer<typeof eventDiscoveryQuerySchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreateOrganizerInput = z.infer<typeof createOrganizerSchema>;
export type UpdateOrganizerInput = z.infer<typeof updateOrganizerSchema>;
export type CreateOrganizerEventInput = z.infer<typeof createOrganizerEventSchema>;
export type UpdateOrganizerEventInput = z.infer<typeof updateOrganizerEventSchema>;
export type UpsertEventCategoryInput = z.infer<typeof upsertEventCategorySchema>;
