import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { Env } from '../../config/env.validation';
import { SupabaseJwtVerifier } from './supabase-jwt.verifier';

const SECRET = 'test-jwt-secret-16';
const SUPABASE_URL = 'https://example.supabase.co';

function signToken(overrides?: {
  sub?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  secret?: string;
  alg?: string;
}) {
  const header = { alg: overrides?.alg ?? 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: 'authenticated',
    sub: overrides?.sub ?? '11111111-1111-1111-1111-111111111111',
    iss: overrides?.iss ?? `${SUPABASE_URL}/auth/v1`,
    aud: overrides?.aud ?? 'authenticated',
    exp: overrides?.exp ?? now + 300,
  };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', overrides?.secret ?? SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

describe('SupabaseJwtVerifier', () => {
  const verifier = new SupabaseJwtVerifier({
    get: (key: string) => {
      if (key === 'SUPABASE_JWT_SECRET') return SECRET;
      if (key === 'SUPABASE_URL') return SUPABASE_URL;
      return undefined;
    },
  } as unknown as ConfigService<Env, true>);

  it('accepts a valid HS256 supabase access token', async () => {
    const token = signToken();
    await expect(verifier.verify(token)).resolves.toEqual({
      userId: '11111111-1111-1111-1111-111111111111',
      jwtRole: 'authenticated',
    });
  });

  it('rejects a token signed with the wrong secret', async () => {
    const token = signToken({ secret: 'other-secret-xxxx' });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token with the wrong audience', async () => {
    const token = signToken({ aud: 'anon' });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    const token = signToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when JWT secret is not configured', async () => {
    const unconfigured = new SupabaseJwtVerifier({
      get: () => undefined,
    } as unknown as ConfigService<Env, true>);
    await expect(unconfigured.verify('a.b.c')).rejects.toThrow(/not configured/);
  });
});
