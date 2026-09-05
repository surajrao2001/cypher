import { z } from 'zod';

const logLevels = ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.string().min(1).default('local'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LOG_LEVEL: z.enum(logLevels).default('info'),
  SENTRY_DSN: z.string().optional(),
  CASHFREE_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_API_VERSION: z.string().default('2025-01-01'),
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
