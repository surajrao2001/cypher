import type {
  CurrentUserDto,
  EventDetailDto,
  EventListResponse,
  HealthResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
} from '@cypher/contracts';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
}

export class CypherApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/v1/health');
  }

  async requestOtp(phone: string): Promise<OtpRequestResponse> {
    return this.request<OtpRequestResponse>('/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, token: string): Promise<OtpVerifyResponse> {
    return this.request<OtpVerifyResponse>('/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, token }),
    });
  }

  async me(): Promise<CurrentUserDto> {
    return this.request<CurrentUserDto>('/v1/me');
  }

  async listEvents(query: {
    q?: string;
    city?: string;
    tag?: string;
    style?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<EventListResponse> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === '' || value === 'all') {
        continue;
      }
      params.set(key, String(value));
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return this.request<EventListResponse>(`/v1/events${suffix}`);
  }

  async getEvent(slugOrId: string): Promise<EventDetailDto | null> {
    const token = await this.options.getAccessToken?.();
    const headers = new Headers();
    headers.set('Accept', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(`${this.options.baseUrl}/v1/events/${encodeURIComponent(slugOrId)}`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }
    return (await response.json()) as EventDetailDto;
  }

  async completeOnboarding(body: {
    dancerName: string;
    city: string;
    name?: string;
    crew?: string;
    styles?: string[];
    instagram?: string;
  }): Promise<CurrentUserDto> {
    return this.request<CurrentUserDto>('/v1/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init.signal ?? AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      let message = `API ${response.status}`;
      try {
        const body = (await response.json()) as { message?: string };
        if (typeof body.message === 'string' && body.message.length > 0) {
          message = body.message;
        }
      } catch {
        // keep status text
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  }
}

export function createApiClient(options: ApiClientOptions): CypherApiClient {
  return new CypherApiClient(options);
}
