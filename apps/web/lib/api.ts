import { createApiClient } from '@cypher/api-client';
import type { EventListResponse } from '@cypher/contracts';

export function resolveApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
  if (typeof window === 'undefined') {
    return raw.replace('://localhost', '://127.0.0.1');
  }
  return raw;
}

export function getServerApi() {
  return createApiClient({
    baseUrl: resolveApiBaseUrl(),
  });
}

export async function loadEventList(query: {
  q?: string;
  city?: string;
  tag?: string;
  type?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<EventListResponse> {
  try {
    return await getServerApi().listEvents(query);
  } catch {
    return { items: [], featured: [], nextUp: [], total: 0, page: 1, pageSize: query.pageSize ?? 20 };
  }
}
