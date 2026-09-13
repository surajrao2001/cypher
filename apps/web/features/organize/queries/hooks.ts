'use client';

import type {
  CheckInListResponse,
  EventUpdateDto,
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerPaymentAccountDto,
} from '@cypher/contracts';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { useAuth } from '@/features/auth/AuthProvider';
import { orgKeys } from '@/features/organize/queries/keys';

const EVENT_STALE_MS = 45_000;
const LIST_STALE_MS = 30_000;
const ORG_STALE_MS = 60_000;

export function useMyOrganizersQuery(enabled = true) {
  const { api, status } = useAuth();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: orgKeys.organizersMine(),
    queryFn: async () => {
      const list = await api.listMyOrganizers();
      for (const org of list) {
        queryClient.setQueryData(orgKeys.organizerSlug(org.slug), org);
      }
      return list;
    },
    enabled: enabled && status === 'authenticated',
    staleTime: ORG_STALE_MS,
  });
}

export function useOrganizerBySlugQuery(slug: string, enabled = true) {
  const { api, status } = useAuth();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: orgKeys.organizerSlug(slug),
    queryFn: () => api.getMyOrganizerBySlug(slug),
    enabled: enabled && Boolean(slug) && status === 'authenticated',
    staleTime: ORG_STALE_MS,
    initialData: () => {
      const mine = queryClient.getQueryData<OrganizerDto[]>(orgKeys.organizersMine());
      return mine?.find((o) => o.slug === slug);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(orgKeys.organizersMine())?.dataUpdatedAt,
  });
}

export function useOrganizerEventsQuery(orgId: string | undefined, enabled = true) {
  const { api, status } = useAuth();
  return useQuery({
    queryKey: orgKeys.organizerEvents(orgId ?? ''),
    queryFn: () => api.listOrganizerEvents(orgId!),
    enabled: enabled && Boolean(orgId) && status === 'authenticated',
    staleTime: LIST_STALE_MS,
  });
}

export function useOrganizerEventQuery(
  orgId: string | undefined,
  eventId: string,
  enabled = true,
) {
  const { api, status } = useAuth();
  return useQuery({
    queryKey: orgKeys.event(eventId),
    queryFn: () => api.getOrganizerEvent(orgId!, eventId),
    enabled: enabled && Boolean(orgId) && Boolean(eventId) && status === 'authenticated',
    staleTime: EVENT_STALE_MS,
  });
}

export function useEventRegistrationsQuery(
  orgId: string | undefined,
  eventId: string,
  enabled = true,
) {
  const { api, status } = useAuth();
  return useQuery({
    queryKey: orgKeys.eventRegistrations(eventId),
    queryFn: () => api.listOrganizerEventRegistrations(orgId!, eventId),
    enabled: enabled && Boolean(orgId) && Boolean(eventId) && status === 'authenticated',
    staleTime: EVENT_STALE_MS,
  });
}

export function useEventCheckInsQuery(
  orgId: string | undefined,
  eventId: string,
  enabled = true,
) {
  const { api, status } = useAuth();
  return useQuery({
    queryKey: orgKeys.eventCheckIns(eventId),
    queryFn: () => api.listCheckIns(orgId!, eventId),
    enabled: enabled && Boolean(orgId) && Boolean(eventId) && status === 'authenticated',
    staleTime: EVENT_STALE_MS,
  });
}

export function useEventUpdatesQuery(
  orgId: string | undefined,
  eventId: string,
  enabled = true,
) {
  const { api, status } = useAuth();
  return useQuery({
    queryKey: orgKeys.eventUpdates(eventId),
    queryFn: async () => {
      const res = await api.listEventUpdates(orgId!, eventId);
      return res.items;
    },
    enabled: enabled && Boolean(orgId) && Boolean(eventId) && status === 'authenticated',
    staleTime: EVENT_STALE_MS,
  });
}

export function usePayoutAccountQuery(orgId: string | undefined, enabled = true) {
  const { api, status } = useAuth();
  return useQuery({
    queryKey: orgKeys.payoutAccount(orgId ?? ''),
    queryFn: () => api.getOrganizerPaymentAccount(orgId!),
    enabled: enabled && Boolean(orgId) && status === 'authenticated',
    staleTime: ORG_STALE_MS,
  });
}

/** Prefetch event detail (and optional regs) for warm Your Events → Home. */
export function prefetchOrganizerEvent(
  queryClient: QueryClient,
  api: ReturnType<typeof useAuth>['api'],
  orgId: string,
  eventId: string,
) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: orgKeys.event(eventId),
      queryFn: () => api.getOrganizerEvent(orgId, eventId),
      staleTime: EVENT_STALE_MS,
    }),
    queryClient.prefetchQuery({
      queryKey: orgKeys.eventRegistrations(eventId),
      queryFn: () => api.listOrganizerEventRegistrations(orgId, eventId),
      staleTime: EVENT_STALE_MS,
    }),
  ]);
}

export function useInvalidateOrganize() {
  const queryClient = useQueryClient();

  return {
    invalidateEvent(eventId: string) {
      void queryClient.invalidateQueries({ queryKey: orgKeys.event(eventId) });
    },
    invalidateEventBundle(eventId: string) {
      void queryClient.invalidateQueries({ queryKey: orgKeys.event(eventId) });
      void queryClient.invalidateQueries({ queryKey: orgKeys.eventRegistrations(eventId) });
      void queryClient.invalidateQueries({ queryKey: orgKeys.eventCheckIns(eventId) });
      void queryClient.invalidateQueries({ queryKey: orgKeys.eventUpdates(eventId) });
    },
    invalidateEventUpdates(eventId: string) {
      void queryClient.invalidateQueries({ queryKey: orgKeys.eventUpdates(eventId) });
    },
    invalidateEventRegistrations(eventId: string) {
      void queryClient.invalidateQueries({ queryKey: orgKeys.eventRegistrations(eventId) });
      void queryClient.invalidateQueries({ queryKey: orgKeys.eventCheckIns(eventId) });
    },
    invalidateOrganizerEvents(orgId: string) {
      void queryClient.invalidateQueries({ queryKey: orgKeys.organizerEvents(orgId) });
    },
    invalidateOrganizersMine() {
      void queryClient.invalidateQueries({ queryKey: orgKeys.organizersMine() });
    },
    setEventCache(event: OrganizerEventDetailDto) {
      queryClient.setQueryData(orgKeys.event(event.id), event);
    },
  };
}

export function usePublishEventMutation(orgId: string, eventId: string) {
  const { api } = useAuth();
  const invalidate = useInvalidateOrganize();
  return useMutation({
    mutationFn: async (action: 'publish' | 'unpublish') => {
      return action === 'publish'
        ? api.publishOrganizerEvent(orgId, eventId)
        : api.unpublishOrganizerEvent(orgId, eventId);
    },
    onSuccess: (event) => {
      invalidate.setEventCache(event);
      invalidate.invalidateOrganizerEvents(orgId);
    },
  });
}

export type {
  CheckInListResponse,
  EventUpdateDto,
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerPaymentAccountDto,
};
