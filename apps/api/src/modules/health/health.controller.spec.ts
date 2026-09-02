import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok payload', () => {
    const controller = new HealthController();
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(() => new Date(result.timestamp).toISOString()).not.toThrow();
  });
});
