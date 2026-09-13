'use client';

import { routes } from '@cypher/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { EditEventDrawer } from '@/features/organize/EditEventDrawer';
import { EventControlHeader } from '@/features/organize/EventControlHeader';
import { EventControlNav } from '@/features/organize/EventControlNav';
import { EventHomePanel } from '@/features/organize/EventHomePanel';
import {
  canPublish,
  hasPaidEntry,
  legacyTabToDest,
  type ControlDest,
} from '@/features/organize/event-control';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import {
  useEventCheckInsQuery,
  useEventRegistrationsQuery,
  useInvalidateOrganize,
  useOrganizerBySlugQuery,
  useOrganizerEventQuery,
  usePayoutAccountQuery,
  usePublishEventMutation,
} from '@/features/organize/queries';
import { PostUpdateDialog } from '@/features/organize/EventUpdatesPanel';
import { SoftError } from '@/features/shell/AsyncState';

function readInitialDest(): ControlDest {
  if (typeof window === 'undefined') return 'home';
  const sp = new URLSearchParams(window.location.search);
  const dest = legacyTabToDest(sp.get('tab') ?? sp.get('section'));
  if (dest === 'entry' || dest === 'people' || dest === 'money') return 'home';
  return dest;
}

export function EventManageView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventManageViewInner slug={slug} eventId={eventId} />
    </OrganizeGate>
  );
}

function EventManageViewInner({ slug, eventId }: { slug: string; eventId: string }) {
  const router = useRouter();
  const invalidate = useInvalidateOrganize();
  const [dest, setDest] = useState<ControlDest>(readInitialDest);
  const [postUpdateOpen, setPostUpdateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const orgQuery = useOrganizerBySlugQuery(slug);
  const org = orgQuery.data;
  const eventQuery = useOrganizerEventQuery(org?.id, eventId, Boolean(org?.id));
  const event = eventQuery.data;
  const regsQuery = useEventRegistrationsQuery(org?.id, eventId, Boolean(org?.id));
  const checkInsQuery = useEventCheckInsQuery(org?.id, eventId, Boolean(org?.id));
  const showMoney = useMemo(() => (event ? hasPaidEntry(event) : false), [event]);
  const payoutQuery = usePayoutAccountQuery(org?.id, Boolean(org?.id) && showMoney);
  const publishMutation = usePublishEventMutation(org?.id ?? '', eventId);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const initialDest = legacyTabToDest(sp.get('tab') ?? sp.get('section'));
    if (initialDest === 'entry') {
      router.replace(routes.organizeEventEntry(slug, eventId));
    } else if (initialDest === 'people') {
      router.replace(routes.organizeEventPeople(slug, eventId));
    } else if (initialDest === 'money') {
      router.replace(routes.organizeEventMoney(slug, eventId));
    }
  }, [eventId, router, slug]);

  useEffect(() => {
    if (dest === 'money' && !showMoney) setDest('home');
  }, [dest, showMoney]);

  async function togglePublish() {
    if (!org || !event || !canPublish(org.role)) return;
    const tid = toastPending(toastCopy.publishing);
    try {
      const updated = await publishMutation.mutateAsync(
        event.status === 'published' ? 'unpublish' : 'publish',
      );
      toastResolve(
        tid,
        updated.status === 'published' ? toastCopy.published : toastCopy.unpublished,
      );
    } catch (err) {
      toastReject(tid, toastCopy.publishFailed, err instanceof Error ? err.message : undefined);
    }
  }

  function navigate(next: ControlDest) {
    if (next === 'entry') {
      router.push(routes.organizeEventEntry(slug, eventId));
      return;
    }
    if (next === 'people') {
      router.push(routes.organizeEventPeople(slug, eventId));
      return;
    }
    if (next === 'money') {
      router.push(routes.organizeEventMoney(slug, eventId));
      return;
    }
    setDest(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next === 'home' ? 'overview' : next);
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
  }

  const loadError = orgQuery.error ?? eventQuery.error;
  // Only block the full page when we have neither cached org nor cached event.
  const coldLoading = !org && !event && (orgQuery.isPending || eventQuery.isPending);

  if (loadError && !org && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load event"
          error={loadError}
          onRetry={() => {
            void orgQuery.refetch();
            void eventQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (coldLoading || !org || !event) {
    return (
      <div className="px-6 py-16">
        <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  const entryHref = routes.organizeEventEntry(org.slug, event.id);
  const peopleHref = routes.organizeEventPeople(org.slug, event.id);
  const regs = regsQuery.data ?? null;
  const checkedInCount = checkInsQuery.data?.totals.checkedIn ?? null;
  const payoutReady =
    !showMoney ? null : payoutQuery.data ? Boolean(payoutQuery.data.payoutReady) : payoutQuery.isPending ? null : false;

  const shell = (
    <OrganizerWorkspace width="canvas" className="relative z-10 space-y-7 md:space-y-8">
      <EventControlHeader
        org={org}
        event={event}
        pending={publishMutation.isPending}
        sharedLayout
        onPublishToggle={() => void togglePublish()}
        onPostUpdate={() => setPostUpdateOpen(true)}
        onEditEvent={() => setEditOpen(true)}
      />

      {dest !== 'home' ? (
        <EventControlNav active={dest} onChange={navigate} showMoney={showMoney} />
      ) : null}

      <PostUpdateDialog
        organizerId={org.id}
        eventId={event.id}
        open={postUpdateOpen}
        onOpenChange={setPostUpdateOpen}
        onPosted={() => {
          setPostUpdateOpen(false);
          invalidate.invalidateEventUpdates(event.id);
        }}
      />

      <EditEventDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        organizerId={org.id}
        orgSlug={org.slug}
        event={event}
        onUpdated={(next) => {
          invalidate.setEventCache(next);
          invalidate.invalidateOrganizerEvents(org.id);
        }}
      />

      {dest === 'home' ? (
        <motion.div
          initial={{ opacity: 0.92 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
        >
          <EventHomePanel
            org={org}
            event={event}
            regs={regs}
            payoutReady={payoutReady}
            checkedInCount={checkedInCount}
            entryHref={entryHref}
            peopleHref={peopleHref}
            onNavigate={navigate}
            onEditEvent={() => setEditOpen(true)}
            onPostUpdate={() => setPostUpdateOpen(true)}
            onViewAllUpdates={() =>
              router.push(routes.organizeEventUpdates(slug, eventId))
            }
            onPublished={(next) => {
              invalidate.setEventCache(next);
              invalidate.invalidateOrganizerEvents(org.id);
            }}
          />
        </motion.div>
      ) : null}
    </OrganizerWorkspace>
  );

  if (dest !== 'home') {
    return shell;
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(42rem,70vh)] bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,rgba(255,104,0,0.28)_0%,rgba(255,104,0,0.12)_28%,rgba(255,104,0,0.04)_52%,transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[min(22rem,38vh)] h-48 bg-gradient-to-b from-transparent via-bg/40 to-bg"
      />
      {shell}
    </div>
  );
}
