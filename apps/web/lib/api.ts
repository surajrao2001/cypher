import { createApiClient } from '@cypher/api-client';
import type { EventListResponse } from '@cypher/contracts';

export function getServerApi() {
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
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
