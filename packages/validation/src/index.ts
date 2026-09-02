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

export type EventDiscoveryQuery = z.infer<typeof eventDiscoveryQuerySchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
