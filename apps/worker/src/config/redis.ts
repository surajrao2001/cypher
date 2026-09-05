import Redis, { type RedisOptions } from 'ioredis';

const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_TLS_PORT = 6380;

export function parseRedisUrl(redisUrl: string): RedisOptions {
  const url = new URL(redisUrl);
  const useTls = url.protocol === 'rediss:';
  const dbSegment = url.pathname.replace(/^\//, '');
  const db = dbSegment ? Number.parseInt(dbSegment, 10) : 0;

  return {
    host: url.hostname,
    port: url.port
      ? Number.parseInt(url.port, 10)
      : useTls
        ? DEFAULT_REDIS_TLS_PORT
        : DEFAULT_REDIS_PORT,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number.isFinite(db) ? db : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: useTls ? {} : undefined,
  };
}

export function createRedisConnection(redisUrl: string): Redis {
  return new Redis(parseRedisUrl(redisUrl));
}
