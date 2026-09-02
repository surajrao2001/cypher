import { createHmac, createPublicKey, createVerify, timingSafeEqual, type JsonWebKey, type KeyObject } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { writeLog } from '../logger';
import type { AuthPrincipal } from './auth.types';

const CLOCK_TOLERANCE_SEC = 5;
const JWKS_TTL_MS = 10 * 60 * 1000;
const ASYMMETRIC_ALGS = new Set(['ES256', 'RS256']);

type JwtHeader = { alg?: string; kid?: string };
type JwksResponse = { keys?: JsonWebKey[] };

@Injectable()
export class SupabaseJwtVerifier {
  private jwksKeys: JsonWebKey[] = [];
  private jwksFetchedAt = 0;
  private jwksUrl: string | null = null;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async verify(token: string): Promise<AuthPrincipal> {
    const secret = this.config.get('SUPABASE_JWT_SECRET', { infer: true });
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    if (!secret && !supabaseUrl) {
      throw new UnauthorizedException('JWT verification is not configured');
    }

    try {
      const payload = await this.verifySignature(token, secret, supabaseUrl);
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
      writeLog({
        level: 'warn',
        message: 'JWT verification failed',
        reason: error instanceof Error ? error.message : 'unknown',
      });
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async verifySignature(
    token: string,
    secret: string | undefined,
    supabaseUrl: string | undefined,
  ): Promise<Record<string, unknown>> {
    const parts = token.split('.');
    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const signatureB64 = parts[2];
    if (parts.length !== 3 || !headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('malformed');
    }

    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as JwtHeader;
    const signed = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');

    if (header.alg === 'HS256') {
      if (!secret) {
        throw new UnauthorizedException('JWT verification is not configured');
      }
      verifyHs256(signed, signature, secret);
    } else if (header.alg && ASYMMETRIC_ALGS.has(header.alg)) {
      if (!supabaseUrl) {
        throw new UnauthorizedException('JWT verification is not configured');
      }
      const key = await this.resolvePublicKey(supabaseUrl, header.kid, header.alg);
      verifyAsymmetric(signed, signature, key, header.alg);
    } else {
      throw new Error('unsupported alg');
    }

    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<string, unknown>;
  }

  private async resolvePublicKey(supabaseUrl: string, kid: string | undefined, alg: string): Promise<KeyObject> {
    const jwk = await this.findJwk(supabaseUrl, kid, alg);
    return createPublicKey({ key: jwk, format: 'jwk' });
  }

  private async findJwk(supabaseUrl: string, kid: string | undefined, alg: string): Promise<JsonWebKey> {
    const url = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
    if (this.jwksUrl !== url) {
      this.jwksUrl = url;
      this.jwksKeys = [];
      this.jwksFetchedAt = 0;
    }

    const pick = (keys: JsonWebKey[]) =>
      keys.find((key) => (kid ? key.kid === kid : true) && (!key.alg || key.alg === alg));

    if (this.jwksKeys.length === 0 || Date.now() - this.jwksFetchedAt > JWKS_TTL_MS) {
      await this.refreshJwks(url);
    }

    const matched = pick(this.jwksKeys);
    if (matched) {
      return matched;
    }

    await this.refreshJwks(url);
    const retried = pick(this.jwksKeys);
    if (!retried) {
      throw new Error('no matching jwk');
    }
    return retried;
  }

  private async refreshJwks(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`jwks ${response.status}`);
    }
    const body = (await response.json()) as JwksResponse;
    this.jwksKeys = Array.isArray(body.keys) ? body.keys : [];
    this.jwksFetchedAt = Date.now();
  }
}

function audienceIncludes(aud: unknown, expected: string): boolean {
  if (aud === expected) {
    return true;
  }
  return Array.isArray(aud) && aud.includes(expected);
}

function verifyHs256(signed: string, signature: Buffer, secret: string): void {
  const expected = createHmac('sha256', secret).update(signed).digest();
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    throw new Error('bad signature');
  }
}

function verifyAsymmetric(signed: string, signature: Buffer, key: KeyObject, alg: string): void {
  const verifier = createVerify('SHA256');
  verifier.update(signed);
  verifier.end();
  const ok =
    alg === 'ES256'
      ? verifier.verify({ key, dsaEncoding: 'ieee-p1363' }, signature)
      : verifier.verify(key, signature);
  if (!ok) {
    throw new Error('bad signature');
  }
}
