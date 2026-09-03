import type {
  CreateOrganizerBody,
  CreateOrganizerEventBody,
  CurrentUserDto,
  EventDetailDto,
  EventListResponse,
  HealthResponse,
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventListResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  UpdateOrganizerBody,
  UpdateOrganizerEventBody,
  CreateEventCategoryBody,
  UpdateEventCategoryBody,
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

  async createOrganizer(body: CreateOrganizerBody): Promise<OrganizerDto> {
    return this.request<OrganizerDto>('/v1/organizers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async listMyOrganizers(): Promise<OrganizerDto[]> {
    return this.request<OrganizerDto[]>('/v1/organizers/mine');
  }

  async getMyOrganizerBySlug(slug: string): Promise<OrganizerDto> {
    return this.request<OrganizerDto>(`/v1/organizers/by-slug/${encodeURIComponent(slug)}`);
  }

  async updateOrganizer(organizerId: string, body: UpdateOrganizerBody): Promise<OrganizerDto> {
    return this.request<OrganizerDto>(`/v1/organizers/${encodeURIComponent(organizerId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async listOrganizerEvents(organizerId: string): Promise<OrganizerEventListResponse> {
    return this.request<OrganizerEventListResponse>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events`,
    );
  }

  async createOrganizerEvent(
    organizerId: string,
    body: CreateOrganizerEventBody,
  ): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  }

  async getOrganizerEvent(organizerId: string, eventId: string): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events/${encodeURIComponent(eventId)}`,
    );
  }

  async updateOrganizerEvent(
    organizerId: string,
    eventId: string,
    body: UpdateOrganizerEventBody,
  ): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
  }

  async publishOrganizerEvent(
    organizerId: string,
    eventId: string,
  ): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events/${encodeURIComponent(eventId)}/publish`,
      { method: 'POST' },
    );
  }

  async unpublishOrganizerEvent(
    organizerId: string,
    eventId: string,
  ): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events/${encodeURIComponent(eventId)}/unpublish`,
      { method: 'POST' },
    );
  }

  async addOrganizerEventCategory(
    organizerId: string,
    eventId: string,
    body: CreateEventCategoryBody,
  ): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events/${encodeURIComponent(eventId)}/categories`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  }

  async updateOrganizerEventCategory(
    organizerId: string,
    eventId: string,
    categoryId: string,
    body: UpdateEventCategoryBody,
  ): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events/${encodeURIComponent(eventId)}/categories/${encodeURIComponent(categoryId)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
  }

  async deleteOrganizerEventCategory(
    organizerId: string,
    eventId: string,
    categoryId: string,
  ): Promise<OrganizerEventDetailDto> {
    return this.request<OrganizerEventDetailDto>(
      `/v1/organizers/${encodeURIComponent(organizerId)}/events/${encodeURIComponent(eventId)}/categories/${encodeURIComponent(categoryId)}`,
      { method: 'DELETE' },
    );
  }

  async uploadPoster(file: Blob, filename = 'poster.jpg'): Promise<{ url: string; filename: string }> {
    const token = await this.options.getAccessToken?.();
    const body = new FormData();
    body.append('file', file, filename);
    const headers = new Headers();
    headers.set('Accept', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(`${this.options.baseUrl}/v1/media/posters`, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      let message = `API ${response.status}`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (typeof payload.message === 'string' && payload.message.length > 0) {
          message = payload.message;
        }
      } catch {
        // keep status
      }
      throw new Error(message);
    }
    return (await response.json()) as { url: string; filename: string };
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
