'use client';

import { routes } from '@cypher/contracts';
import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { EventControlHeader } from '@/features/organize/EventControlHeader';
import { EventControlNav } from '@/features/organize/EventControlNav';
import { EventEntryPanel } from '@/features/organize/EventEntryView';
import { EventHomePanel } from '@/features/organize/EventHomePanel';
import { EventMoneyPanel } from '@/features/organize/EventMoneyPanel';
import { EventPagePanel } from '@/features/organize/EventPagePanel';
import { EventPeoplePanel } from '@/features/organize/EventPeoplePanel';
import {
  canPublish,
  hasPaidEntry,
  isFreeOnlyEvent,
  legacyTabToDest,
  type ControlDest,
} from '@/features/organize/event-control';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { PostUpdateDialog } from '@/features/organize/EventUpdatesPanel';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';

export function EventManageView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <Suspense fallback={<PageLoading variant="detail" className="px-6 py-16" label="Loading event" />}>
        <EventManageViewInner slug={slug} eventId={eventId} />
      </Suspense>
    </OrganizeGate>
  );
}

function EventManageViewInner({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const initialDest = legacyTabToDest(searchParams.get('tab') ?? searchParams.get('section'));
  const [dest, setDest] = useState<ControlDest>(initialDest);
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [regs, setRegs] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [checkedInCount, setCheckedInCount] = useState<number | null>(null);
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [postUpdateOpen, setPostUpdateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        const [detail, regList, checkIns] = await Promise.all([
          auth.api.getOrganizerEvent(organizer.id, eventId),
          auth.api.listOrganizerEventRegistrations(organizer.id, eventId).catch(() => null),
          auth.api.listCheckIns(organizer.id, eventId).catch(() => null),
        ]);
        if (cancelled) return;
        setOrg(organizer);
        setEvent(detail);
        setRegs(regList);
        setCheckedInCount(checkIns?.totals.checkedIn ?? null);
      } catch (err) {
        if (!cancelled) setLoadError(err);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, slug, reloadKey]);

  const paid = useMemo(() => (event ? hasPaidEntry(event) : false), [event]);
  const freeOnly = useMemo(() => (event ? isFreeOnlyEvent(event) : true), [event]);
  const showMoney = Boolean(event && (!freeOnly || paid));

  useEffect(() => {
    if (!org || !showMoney) {
      setPayoutReady(null);
      return;
    }
    let cancelled = false;
    void auth.api
      .getOrganizerPaymentAccount(org.id)
      .then((row) => {
        if (!cancelled) setPayoutReady(Boolean(row.payoutReady));
      })
      .catch(() => {
        if (!cancelled) setPayoutReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.api, org, showMoney, event?.id]);

  useEffect(() => {
    if (dest === 'money' && !showMoney) setDest('home');
  }, [dest, showMoney]);

  async function togglePublish() {
    if (!org || !event || !canPublish(org.role)) return;
    setPending(true);
    const tid = toastPending(toastCopy.publishing);
    try {
      const updated =
        event.status === 'published'
          ? await auth.api.unpublishOrganizerEvent(org.id, event.id)
          : await auth.api.publishOrganizerEvent(org.id, event.id);
      setEvent(updated);
      toastResolve(
        tid,
        updated.status === 'published' ? toastCopy.published : toastCopy.unpublished,
      );
    } catch (err) {
      toastReject(tid, toastCopy.publishFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  function navigate(next: ControlDest) {
    const prev = dest;
    setDest(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next === 'home' ? 'overview' : next);
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
    if (prev === 'entry' || next === 'home' || next === 'people') {
      setReloadKey((n) => n + 1);
    }
  }

  if (loadError && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load event"
          error={loadError}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }

  if (!org || !event) {
    return <PageLoading variant="detail" className="px-6 py-16" label="Loading event" />;
  }

  const entryHref = routes.organizeEventEntry(org.slug, event.id);

  return (
    <OrganizerWorkspace width="wide" className="space-y-6">
      <EventControlHeader
        org={org}
        event={event}
        pending={pending}
        onPublishToggle={() => void togglePublish()}
        onPostUpdate={() => setPostUpdateOpen(true)}
      />

      <EventControlNav active={dest} onChange={navigate} showMoney={showMoney} />

      <PostUpdateDialog
        organizerId={org.id}
        eventId={event.id}
        open={postUpdateOpen}
        onOpenChange={setPostUpdateOpen}
        onPosted={() => {
          setDest('page');
          setReloadKey((n) => n + 1);
        }}
      />

      {dest === 'home' ? (
        <EventHomePanel
          org={org}
          event={event}
          regs={regs}
          payoutReady={payoutReady}
          checkedInCount={checkedInCount}
          onNavigate={navigate}
          onPublished={(next) => {
            setEvent(next);
            setReloadKey((n) => n + 1);
          }}
        />
      ) : null}

      {dest === 'people' ? (
        <EventPeoplePanel
          organizerId={org.id}
          eventId={eventId}
          event={event}
          entryHref={entryHref}
          onOpenEntry={() => navigate('entry')}
        />
      ) : null}

      {dest === 'entry' ? <EventEntryPanel slug={slug} eventId={eventId} /> : null}

      {dest === 'money' ? <EventMoneyPanel org={org} event={event} regs={regs} /> : null}

      {dest === 'page' ? (
        <EventPagePanel org={org} event={event} onEventChange={setEvent} />
      ) : null}
    </OrganizerWorkspace>
  );
}
