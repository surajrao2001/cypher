import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { SupabaseGoTrueClient } from './supabase-gotrue.client';

describe('SupabaseGoTrueClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fails closed when OTP is not configured', async () => {
    const client = new SupabaseGoTrueClient({ get: () => undefined } as never);
    await expect(client.requestSmsOtp('+919876543210')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps failed GoTrue responses to unauthorized without leaking the body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ msg: 'secret supabase error' }),
    }) as never;
    const client = new SupabaseGoTrueClient({
      get: (key: string) => (key === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'anon-key-value-1234567890'),
    } as never);
    await expect(client.requestSmsOtp('+919876543210')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
