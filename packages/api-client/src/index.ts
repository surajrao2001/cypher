import type { HealthResponse } from '@cypher/contracts';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
}

export class CypherApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/v1/health');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }
}

export function createApiClient(options: ApiClientOptions): CypherApiClient {
  return new CypherApiClient(options);
}
