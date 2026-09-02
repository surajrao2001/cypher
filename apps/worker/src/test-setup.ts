process.env.NODE_ENV ??= 'test';
process.env.APP_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://cypher:cypher@localhost:5432/cypher?schema=public';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.LOG_LEVEL ??= 'error';
