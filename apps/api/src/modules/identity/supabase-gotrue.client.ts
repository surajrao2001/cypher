import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';

type GoTrueSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: { id?: string };
};

type GoTrueError = {
  msg?: string;
  message?: string;
  error_code?: string;
  error?: string;
};

@Injectable()
export class SupabaseGoTrueClient {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async requestSmsOtp(phone: string): Promise<void> {
    await this.post('/otp', { phone, create_user: true, channel: 'sms' });
  }

  async verifySmsOtp(
    phone: string,
    token: string,
  ): Promise<{
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

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    const anonKey = this.config.get('SUPABASE_ANON_KEY', { infer: true });
    if (!supabaseUrl || !anonKey) {
      throw new ServiceUnavailableException('Phone OTP is not configured');
    }

    const headers: Record<string, string> = {
      apikey: anonKey,
      'Content-Type': 'application/json',
    };
    // Legacy anon keys are JWTs and still go on Authorization. New publishable keys are not JWTs;
    // Kong returns 401 if they are sent as Bearer.
    if (anonKey.startsWith('eyJ')) {
      headers.Authorization = `Bearer ${anonKey}`;
    }

    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as T & GoTrueError;
    if (!response.ok) {
      throw this.mapGoTrueError(response.status, payload);
    }
    return payload;
  }

  private mapGoTrueError(status: number, payload: GoTrueError): HttpException {
    const code = payload.error_code ?? payload.error;
    if (status === 401 || status === 403) {
      return new BadGatewayException(
        'Supabase rejected the Auth API key. Set SUPABASE_ANON_KEY to the anon or publishable key, not the JWT secret.',
      );
    }
    if (status === 429) {
      return new HttpException('Too many OTP attempts. Wait and try again.', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (code === 'phone_provider_disabled') {
      return new ServiceUnavailableException('Phone OTP is not enabled on this Supabase project.');
    }
    if (status >= 500) {
      return new BadGatewayException('Supabase Auth could not send the code. Check the SMS provider.');
    }
    return new HttpException('Unable to send or verify the phone code.', status >= 400 && status < 500 ? status : 400);
  }
}
