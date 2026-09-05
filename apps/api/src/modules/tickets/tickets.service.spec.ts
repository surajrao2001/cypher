import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  const config = {
    get: jest.fn().mockReturnValue('test-ticket-signing-secret-32'),
  };
  const service = new TicketsService(config as never);

  it('builds a verifiable HMAC payload', () => {
    const payload = service.buildPayload('11111111-1111-4111-8111-111111111111');
    expect(payload.startsWith('cy1.')).toBe(true);
    expect(service.verifyPayload(payload)).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('rejects tampered payloads', () => {
    const payload = service.buildPayload('11111111-1111-4111-8111-111111111111');
    expect(service.verifyPayload(`${payload}x`)).toBeNull();
  });

  it('hashes payloads for at-rest storage', () => {
    const { payload, hash } = service.issueHash('11111111-1111-4111-8111-111111111111');
    expect(hash).toHaveLength(64);
    expect(hash).toBe(service.hashPayload(payload));
  });
});
