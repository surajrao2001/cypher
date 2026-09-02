import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';

type GoTrueSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: { id?: string };
};

@Injectable()
export class SupabaseGoTrueClient {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async requestSmsOtp(phone: string): Promise<void> {
    await this.post('/otp', { phone });
  }

  async verifySmsOtp(phone: string, token: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    userId: string;
  }> {
    const session = await this.post<GoTrueSession>('/verify', {
      type: 'sms',
      phone,
      token,
    });
    const accessToken = session.access_token;
    const refreshToken = session.refresh_token;
    const userId = session.user?.id;
    if (!accessToken || !refreshToken || !userId) {
      throw new UnauthorizedException('Unable to complete phone verification');
    }
    return {
      accessToken,
      refreshToken,
      expiresIn: session.expires_in ?? 3600,
      tokenType: session.token_type ?? 'bearer',
      userId,
    };
  }

  private async post<T>(path: string, body: Record<string, string>): Promise<T> {
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    const anonKey = this.config.get('SUPABASE_ANON_KEY', { infer: true });
    if (!supabaseUrl || !anonKey) {
      throw new ServiceUnavailableException('Phone OTP is not configured');
    }

    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1${path}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as T;
    if (!response.ok) {
      throw new UnauthorizedException('Unable to complete phone verification');
    }
    return payload;
  }
}
