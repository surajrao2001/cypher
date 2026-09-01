import { z } from 'zod';

export const indianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Use E.164 Indian mobile: +91 followed by 10 digits');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const eventDiscoveryQuerySchema = paginationQuerySchema.extend({
  city: z.string().min(1).max(80).optional(),
  style: z.string().min(1).max(40).optional(),
  q: z.string().min(1).max(80).optional(),
});

export type EventDiscoveryQuery = z.infer<typeof eventDiscoveryQuerySchema>;
