import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const prisma = { $queryRaw: jest.fn() };
  const redis = { ping: jest.fn() };
  const controller = new HealthController(prisma as never, redis as never);

  it('returns ok payload', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
  });

  it('reports ready when database and redis respond', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue(true);
    const result = await controller.ready();
    expect(result.database).toBe(true);
    expect(result.redis).toBe(true);
  });

  it('returns 503 when a dependency is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('down'));
    redis.ping.mockResolvedValue(true);
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
