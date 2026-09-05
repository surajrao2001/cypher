import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
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

  it('does not send a non-JWT publishable key as a Bearer token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as never;
    const client = new SupabaseGoTrueClient({
      get: (key: string) =>
        key === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'sb_publishable_xxxxxxxxxxxxxxxx',
    } as never);
    await client.requestSmsOtp('+919876543210');
    const headers = (global.fetch as jest.Mock).mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.apikey).toMatch(/^sb_publishable_/);
    expect(headers.Authorization).toBeUndefined();
  });

  it('maps a 401 from GoTrue to a key-configuration error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ msg: 'Invalid JWT' }),
    }) as never;
    const client = new SupabaseGoTrueClient({
      get: (key: string) => (key === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'anon-key-value-1234567890'),
    } as never);
    await expect(client.requestSmsOtp('+919876543210')).rejects.toBeInstanceOf(BadGatewayException);
  });
});
