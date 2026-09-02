import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import type { AuthPrincipal } from './auth.types';

const CLOCK_TOLERANCE_SEC = 5;

@Injectable()
export class SupabaseJwtVerifier {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async verify(token: string): Promise<AuthPrincipal> {
    const secret = this.config.get('SUPABASE_JWT_SECRET', { infer: true });
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    if (!secret) {
      throw new UnauthorizedException('JWT verification is not configured');
    }

    try {
      const payload = verifyHs256(token, secret);
      const now = Math.floor(Date.now() / 1000);

      if (typeof payload.exp === 'number' && now > payload.exp + CLOCK_TOLERANCE_SEC) {
        throw new UnauthorizedException('Invalid access token');
      }
      if (typeof payload.nbf === 'number' && now + CLOCK_TOLERANCE_SEC < payload.nbf) {
        throw new UnauthorizedException('Invalid access token');
      }
      if (!audienceIncludes(payload.aud, 'authenticated')) {
        throw new UnauthorizedException('Invalid access token');
      }
      if (supabaseUrl) {
        const expectedIssuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
        if (payload.iss !== expectedIssuer) {
          throw new UnauthorizedException('Invalid access token');
        }
      }

      const userId = payload.sub;
      if (typeof userId !== 'string' || userId.length === 0) {
        throw new UnauthorizedException('Invalid access token');
      }

      const jwtRole = typeof payload.role === 'string' ? payload.role : 'authenticated';
      return { userId, jwtRole };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid access token');
    }
  }
}

function audienceIncludes(aud: unknown, expected: string): boolean {
  if (aud === expected) {
    return true;
  }
  return Array.isArray(aud) && aud.includes(expected);
}

function verifyHs256(token: string, secret: string): Record<string, unknown> {
  const parts = token.split('.');
  const headerB64 = parts[0];
  const payloadB64 = parts[1];
  const signatureB64 = parts[2];
  if (parts.length !== 3 || !headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('malformed');
  }
  const expected = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest();
  const actual = Buffer.from(signatureB64, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('bad signature');
  }
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as { alg?: string };
  if (header.alg !== 'HS256') {
    throw new Error('unsupported alg');
  }
  return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<string, unknown>;
}
