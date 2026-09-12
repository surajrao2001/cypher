'use client';

import { routes } from '@cypher/contracts';
import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { EditEventDrawer } from '@/features/organize/EditEventDrawer';
import { EventControlHeader } from '@/features/organize/EventControlHeader';
import { EventControlNav } from '@/features/organize/EventControlNav';
import { EventHomePanel } from '@/features/organize/EventHomePanel';
import { EventMoneyPanel } from '@/features/organize/EventMoneyPanel';
import {
  canPublish,
  hasPaidEntry,
  legacyTabToDest,
  type ControlDest,
} from '@/features/organize/event-control';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { EventUpdatesPanel, PostUpdateDialog } from '@/features/organize/EventUpdatesPanel';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDest = legacyTabToDest(searchParams.get('tab') ?? searchParams.get('section'));
  const [dest, setDest] = useState<ControlDest>(
    initialDest === 'entry' || initialDest === 'people' ? 'home' : initialDest,
  );
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [regs, setRegs] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [checkedInCount, setCheckedInCount] = useState<number | null>(null);
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [postUpdateOpen, setPostUpdateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [updatesRefreshKey, setUpdatesRefreshKey] = useState(0);

  useEffect(() => {
    if (initialDest === 'entry') {
      router.replace(routes.organizeEventEntry(slug, eventId));
    } else if (initialDest === 'people') {
      router.replace(routes.organizeEventPeople(slug, eventId));
    }
  }, [eventId, initialDest, router, slug]);

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

  const showMoney = useMemo(() => (event ? hasPaidEntry(event) : false), [event]);

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
    if (next === 'entry') {
      router.push(routes.organizeEventEntry(slug, eventId));
      return;
    }
    if (next === 'people') {
      router.push(routes.organizeEventPeople(slug, eventId));
      return;
    }
    const prev = dest;
    setDest(next);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', next === 'home' ? 'overview' : next);
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
    if (prev === 'home' || next === 'home') {
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
  const peopleHref = routes.organizeEventPeople(org.slug, event.id);

  const shell = (
    <OrganizerWorkspace width="canvas" className="relative z-10 space-y-7 md:space-y-8">
      <EventControlHeader
        org={org}
        event={event}
        pending={pending}
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
          setUpdatesRefreshKey((n) => n + 1);
        }}
      />

      <Dialog open={updatesOpen} onOpenChange={setUpdatesOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-[#2a2a2a] bg-[#141414]">
          <DialogHeader>
            <DialogTitle>Updates</DialogTitle>
          </DialogHeader>
          <EventUpdatesPanel
            organizerId={org.id}
            eventId={event.id}
            refreshKey={updatesRefreshKey}
          />
          <button
            type="button"
            onClick={() => {
              setUpdatesOpen(false);
              setPostUpdateOpen(true);
            }}
            className="mt-2 text-sm font-semibold text-accent hover:underline"
          >
            Post update
          </button>
        </DialogContent>
      </Dialog>

      <EditEventDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        organizerId={org.id}
        orgSlug={org.slug}
        event={event}
        onUpdated={(next) => {
          setEvent(next);
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
          entryHref={entryHref}
          peopleHref={peopleHref}
          onNavigate={navigate}
          onEditEvent={() => setEditOpen(true)}
          onPostUpdate={() => setPostUpdateOpen(true)}
          onViewAllUpdates={() => setUpdatesOpen(true)}
          updatesRefreshKey={updatesRefreshKey}
          onPublished={(next) => {
            setEvent(next);
            setReloadKey((n) => n + 1);
          }}
        />
      ) : null}

      {dest === 'money' ? <EventMoneyPanel org={org} event={event} regs={regs} /> : null}
    </OrganizerWorkspace>
  );

  if (dest !== 'home') {
    return shell;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Full-bleed stage wash — spans viewport, fades into content below */}
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
