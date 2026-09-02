import { validateEnv } from './env.validation';

const validEnv = {
  DATABASE_URL: 'postgresql://cypher:cypher@localhost:5432/cypher?schema=public',
  WEB_ORIGIN: 'http://localhost:3000',
  REDIS_URL: 'redis://localhost:6379',
};

describe('validateEnv', () => {
  it('applies defaults for port and prefix', () => {
    const env = validateEnv(validEnv);
    expect(env.API_PORT).toBe(3001);
    expect(env.API_PREFIX).toBe('v1');
    expect(env.SUPABASE_JWT_SECRET).toBeUndefined();
  });

  it('treats empty supabase secrets as unset', () => {
    const env = validateEnv({
      ...validEnv,
      SUPABASE_URL: '',
      SUPABASE_JWT_SECRET: '',
    });
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.SUPABASE_JWT_SECRET).toBeUndefined();
  });

  it('rejects a missing database url', () => {
    expect(() => validateEnv({ WEB_ORIGIN: validEnv.WEB_ORIGIN, REDIS_URL: validEnv.REDIS_URL })).toThrow(
      /DATABASE_URL/,
    );
  });
});
