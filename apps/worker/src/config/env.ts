import { z } from 'zod';

const logLevels = ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value === '' ? undefined : value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.preprocess(emptyToUndefined, z.string().min(1).optional()).default('local'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LOG_LEVEL: z.preprocess(emptyToUndefined, z.enum(logLevels).optional()).default('info'),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().optional()),
  // Empty shared Railway vars (e.g. CASHFREE_ENV="") must not fail boot — match API preprocess.
  CASHFREE_ENV: z.preprocess(emptyToUndefined, z.enum(['sandbox', 'production']).optional()).transform(
    (value) => value ?? 'sandbox',
  ),
  CASHFREE_APP_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  CASHFREE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CASHFREE_API_VERSION: z
    .preprocess(emptyToUndefined, z.string().optional())
    .transform((value) => value ?? '2025-01-01'),
});

export type WorkerEnv = z.infer<typeof envSchema>;
export type LogLevel = (typeof logLevels)[number];

export function validateEnv(config: Record<string, unknown>): WorkerEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid worker environment: ${issues}`);
  }
  return result.data;
}
