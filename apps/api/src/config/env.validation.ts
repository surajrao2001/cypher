import { z } from 'zod';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_PREFIX: z.string().min(1).default('v1'),
  WEB_ORIGIN: z.string().url(),
  REDIS_URL: z.string().min(1),
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SUPABASE_JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
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
