import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  it('skips Redis when rate limits are disabled', async () => {
    const redis = { client: { incr: jest.fn(), connect: jest.fn() } };
    const config = { get: jest.fn().mockReturnValue(false) };
    const service = new RateLimitService(redis as never, config as never);
    await expect(service.consume('rl:ip:1', 1, 60)).resolves.toBeUndefined();
    expect(redis.client.incr).not.toHaveBeenCalled();
  });
});
