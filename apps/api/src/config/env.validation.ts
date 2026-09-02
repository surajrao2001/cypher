import { z } from 'zod';

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value === '' ? undefined : value;
  }
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  return trimmed === '' ? undefined : trimmed;
};

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    API_PREFIX: z.string().min(1).default('v1'),
    WEB_ORIGIN: z.string().url(),
    MOBILE_ORIGIN: z.preprocess(emptyToUndefined, z.string().url().optional()),
    REDIS_URL: z.string().min(1),
    SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
    SUPABASE_JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
    RATE_LIMIT_ENABLED: z.preprocess((value) => {
      if (value === 'false' || value === false) return false;
      if (value === 'true' || value === true) return true;
      return undefined;
    }, z.boolean().optional()),
  })
  .transform((data) => ({
    ...data,
    RATE_LIMIT_ENABLED: data.RATE_LIMIT_ENABLED ?? data.NODE_ENV !== 'test',
  }))
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') {
      return;
    }
    if (!data.SUPABASE_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_JWT_SECRET'],
        message: 'Required in production',
      });
    }
    if (!data.SUPABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_URL'],
        message: 'Required in production',
      });
    }
    if (!data.SUPABASE_ANON_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_ANON_KEY'],
        message: 'Required in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${details}`);
  }
  return parsed.data;
}
