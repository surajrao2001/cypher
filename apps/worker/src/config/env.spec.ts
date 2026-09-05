import { validateEnv } from './env';

describe('validateEnv', () => {
  const valid = {
    NODE_ENV: 'development',
    APP_ENV: 'local',
    DATABASE_URL: 'postgresql://cypher:cypher@localhost:5432/cypher?schema=public',
    REDIS_URL: 'redis://localhost:6379',
    LOG_LEVEL: 'info',
  };

  it('accepts a complete environment', () => {
    expect(validateEnv(valid)).toMatchObject({
      NODE_ENV: 'development',
      REDIS_URL: 'redis://localhost:6379',
      DATABASE_URL: valid.DATABASE_URL,
    });
  });

  it('rejects a missing REDIS_URL', () => {
    expect(() => validateEnv({ ...valid, REDIS_URL: '' })).toThrow(/REDIS_URL/);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });
});
