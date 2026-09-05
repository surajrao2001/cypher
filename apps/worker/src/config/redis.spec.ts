import { parseRedisUrl } from './redis';

describe('parseRedisUrl', () => {
  it('parses a local redis URL', () => {
    expect(parseRedisUrl('redis://localhost:6379')).toMatchObject({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  });

  it('parses credentials, db index, and TLS', () => {
    expect(parseRedisUrl('rediss://user:s3cret@redis.example.com:6380/2')).toMatchObject({
      host: 'redis.example.com',
      port: 6380,
      username: 'user',
      password: 's3cret',
      db: 2,
      tls: {},
    });
  });
});
