import { createHmac, generateKeyPairSync, sign } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { Env } from '../../config/env.validation';
import { SupabaseJwtVerifier } from './supabase-jwt.verifier';

const SECRET = 'test-jwt-secret-16';
const SUPABASE_URL = 'https://example.supabase.co';

function signHs256(overrides?: {
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

function verifier(overrides?: { jwtSecret?: string | undefined; supabaseUrl?: string | undefined }) {
  return new SupabaseJwtVerifier({
    get: (key: string) => {
      if (key === 'SUPABASE_JWT_SECRET') return overrides && 'jwtSecret' in overrides ? overrides.jwtSecret : SECRET;
      if (key === 'SUPABASE_URL') {
        return overrides && 'supabaseUrl' in overrides ? overrides.supabaseUrl : SUPABASE_URL;
      }
      return undefined;
    },
  } as unknown as ConfigService<Env, true>);
}

describe('SupabaseJwtVerifier', () => {
  it('accepts a valid HS256 supabase access token', async () => {
    const token = signHs256();
    await expect(verifier().verify(token)).resolves.toEqual({
      userId: '11111111-1111-1111-1111-111111111111',
      jwtRole: 'authenticated',
    });
  });

  it('rejects a token signed with the wrong secret', async () => {
    const token = signHs256({ secret: 'other-secret-xxxx' });
    await expect(verifier().verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token with the wrong audience', async () => {
    const token = signHs256({ aud: 'anon' });
    await expect(verifier().verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    const token = signHs256({ exp: Math.floor(Date.now() / 1000) - 60 });
    await expect(verifier().verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when JWT verification is not configured', async () => {
    const unconfigured = verifier({ jwtSecret: undefined, supabaseUrl: undefined });
    await expect(unconfigured.verify('a.b.c')).rejects.toThrow(/not configured/);
  });

  it('accepts an ES256 token via JWKS', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-es256', alg: 'ES256', use: 'sig' };
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: 'test-es256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        role: 'authenticated',
        sub: '22222222-2222-2222-2222-222222222222',
        iss: `${SUPABASE_URL}/auth/v1`,
        aud: 'authenticated',
        exp: now + 300,
      }),
    ).toString('base64url');
    const signed = `${header}.${payload}`;
    const signature = sign('SHA256', Buffer.from(signed), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString(
      'base64url',
    );
    const token = `${signed}.${signature}`;

    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [jwk] }),
    } as Response);

    await expect(verifier({ jwtSecret: undefined }).verify(token)).resolves.toEqual({
      userId: '22222222-2222-2222-2222-222222222222',
      jwtRole: 'authenticated',
    });
    fetchMock.mockRestore();
  });
});
