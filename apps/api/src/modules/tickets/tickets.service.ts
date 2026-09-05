import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /** Opaque QR payload; HMAC so plaintext need not be stored. */
  buildPayload(registrationId: string): string {
    const sig = createHmac('sha256', this.signingSecret())
      .update(`ticket:v1:${registrationId}`)
      .digest('base64url');
    return `cy1.${registrationId}.${sig}`;
  }

  hashPayload(payload: string): string {
    return createHash('sha256').update(payload).digest('hex');
  }

  verifyPayload(payload: string): string | null {
    const parts = payload.split('.');
    if (parts.length !== 3 || parts[0] !== 'cy1' || !parts[1] || !parts[2]) {
      return null;
    }
    const registrationId = parts[1];
    const expected = this.buildPayload(registrationId);
    const a = Buffer.from(payload);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    return registrationId;
  }

  issueHash(registrationId: string): { payload: string; hash: string } {
    const payload = this.buildPayload(registrationId);
    return { payload, hash: this.hashPayload(payload) };
  }

  private signingSecret(): string {
    return (
      this.config.get('SUPABASE_JWT_SECRET', { infer: true }) ??
      'local-dev-ticket-signing-secret'
    );
  }
}

export type RegistrationWithTicket = Prisma.RegistrationGetPayload<{
  include: {
    category: true;
    event: { include: { organizer: true } };
    participants: true;
  };
}>;
