process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://cypher:cypher@localhost:5433/cypher?schema=public';
process.env.WEB_ORIGIN ??= 'http://localhost:3000';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.RATE_LIMIT_ENABLED ??= 'false';
