import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { maskPhone, phoneFingerprint } from '../../common/auth/phone';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { writeLog } from '../../common/logger';
import { SupabaseGoTrueClient } from './supabase-gotrue.client';

const SEND_WINDOW_SEC = 15 * 60;
const SEND_LIMIT = 5;
const VERIFY_WINDOW_SEC = 10 * 60;
const VERIFY_LIMIT = 5;
const RESEND_DELAY_SEC = 45;

@Injectable()
export class PhoneOtpService {
  constructor(
    private readonly goTrue: SupabaseGoTrueClient,
    private readonly rateLimit: RateLimitService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async requestOtp(phone: string, ip: string): Promise<{ ok: true }> {
    const fp = this.fingerprint(phone);
    await this.rateLimit.consume(`otp:send:phone:${fp}`, SEND_LIMIT, SEND_WINDOW_SEC);
    await this.rateLimit.consume(`otp:send:ip:${ip || 'unknown'}`, SEND_LIMIT, SEND_WINDOW_SEC);
    try {
      await this.rateLimit.consume(`otp:cooldown:${fp}`, 1, RESEND_DELAY_SEC);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw new HttpException('Wait before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }

    writeLog({
      level: 'info',
      message: 'OTP requested',
      phone: maskPhone(phone),
    });
    await this.goTrue.requestSmsOtp(phone);
    return { ok: true };
  }

  async verifyOtp(phone: string, token: string) {
    const fp = this.fingerprint(phone);
    await this.rateLimit.consume(`otp:verify:phone:${fp}`, VERIFY_LIMIT, VERIFY_WINDOW_SEC);
    return this.goTrue.verifySmsOtp(phone, token);
  }

  private fingerprint(phone: string): string {
    const secret = this.config.get('SUPABASE_JWT_SECRET', { infer: true }) ?? 'local-otp-hash';
    return phoneFingerprint(phone, secret);
  }
}
