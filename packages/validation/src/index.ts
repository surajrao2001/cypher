import { z } from 'zod';

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
  teamSize: z.number().int().min(1).max(50).optional(),
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
  eventType: z.enum(['battle', 'jam', 'workshop', 'showcase']).optional(),
  city: z.string().trim().min(2).max(80),
  venue: z.string().trim().max(160).optional(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }).optional(),
  posterUrl: z.string().url().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  styles: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  categories: z.array(categoryInputSchema).min(1).max(20).optional(),
});

export const updateOrganizerEventSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  eventType: z.enum(['battle', 'jam', 'workshop', 'showcase']).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  venue: z.string().trim().max(160).nullable().optional(),
  startTime: z.string().datetime({ offset: true }).optional(),
  endTime: z.string().datetime({ offset: true }).nullable().optional(),
  posterUrl: z.string().url().max(500).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  styles: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  featured: z.boolean().optional(),
});

export const upsertEventCategorySchema = categoryInputSchema;

export type EventDiscoveryQuery = z.infer<typeof eventDiscoveryQuerySchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreateOrganizerInput = z.infer<typeof createOrganizerSchema>;
export type UpdateOrganizerInput = z.infer<typeof updateOrganizerSchema>;
export type CreateOrganizerEventInput = z.infer<typeof createOrganizerEventSchema>;
export type UpdateOrganizerEventInput = z.infer<typeof updateOrganizerEventSchema>;
export type UpsertEventCategoryInput = z.infer<typeof upsertEventCategorySchema>;
