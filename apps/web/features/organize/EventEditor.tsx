'use client';

/**
 * Event details + media editor.
 * Competition / audience / early bird live on the Entry surface (Phase C).
 */

import { routes } from '@cypher/contracts';
import type { EventType, OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { assertEndAfterStart, assertRegistrationWindow } from '@cypher/validation';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { EventMediaLinksEditor } from '@/features/organize/EventMediaLinksEditor';
import { EVENT_TYPE_GROUPS, eventTypeHint } from '@/features/organize/event-taxonomy';
import {
  isEventEditStepId,
  type EventEditStepId,
} from '@/features/organize/EventEditStepper';
import { PosterField } from '@/features/organize/PosterField';
import { StyleChipsField } from '@/features/organize/StyleChipsField';
import { VenueMapField, type VenueCoords } from '@/features/organize/VenueMapField';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';

function toIsoFromLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date/time');
  }
  return date.toISOString();
}

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStartLocal(): string {
  const d = new Date();
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  d.setHours(18, 0, 0, 0);
  return toLocalInputValue(d.toISOString());
}

const LEGACY_ENTRY_HASHES = new Set(['categories', 'viewers', 'early-bird']);

function stepFromHash(): EventEditStepId {
  if (typeof window === 'undefined') return 'basics';
  const raw = window.location.hash.replace(/^#/, '');
  if (LEGACY_ENTRY_HASHES.has(raw)) return 'basics';
  return isEventEditStepId(raw) ? raw : 'basics';
}

export function EventEditor({ slug, eventId }: { slug: string; eventId?: string }) {
  return (
    <OrganizeGate>
      <Suspense fallback={<PageLoading variant="form" className="px-6 py-16" label="Loading editor" />}>
        <EventEditorInner slug={slug} eventId={eventId} />
      </Suspense>
    </OrganizeGate>
  );
}

function EventEditorInner({ slug, eventId }: { slug: string; eventId?: string }) {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreate = !eventId;
  const isFresh = isCreate || searchParams.get('fresh') === '1';
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [coords, setCoords] = useState<VenueCoords | null>(null);
  const [eventType, setEventType] = useState<EventType>('battle');
  const [startTime, setStartTime] = useState(() => (isCreate ? defaultStartLocal() : ''));
  const [endTime, setEndTime] = useState('');
  const [regOpensAt, setRegOpensAt] = useState('');
  const [regClosesAt, setRegClosesAt] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [step, setStep] = useState<EventEditStepId>('basics');

  function goToStep(next: EventEditStepId) {
    setStep(next);
    if (typeof window !== 'undefined') {
      const url = `${window.location.pathname}${window.location.search}#${next}`;
      window.history.replaceState(null, '', url);
      window.requestAnimationFrame(() => {
        const el = document.getElementById('edit-steps');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !eventId) return;
    const raw = window.location.hash.replace(/^#/, '');
    if (LEGACY_ENTRY_HASHES.has(raw)) {
      router.replace(routes.organizeEventEntry(slug, eventId));
    }
  }, [eventId, router, slug]);

  useEffect(() => {
    setStep(stepFromHash());
    function onHashChange() {
      const raw = window.location.hash.replace(/^#/, '');
      if (eventId && LEGACY_ENTRY_HASHES.has(raw)) {
        router.replace(routes.organizeEventEntry(slug, eventId));
        return;
      }
      setStep(stepFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [eventId, router, slug]);

  function syncFromEvent(detail: OrganizerEventDetailDto) {
    setEvent(detail);
    setTitle(detail.title === 'Untitled night' ? '' : detail.title);
    setCity(detail.city === 'TBD' ? '' : detail.city);
    setVenue(detail.venue ?? '');
    setCoords(
      detail.venueLatitude != null && detail.venueLongitude != null
        ? { lat: detail.venueLatitude, lng: detail.venueLongitude }
        : null,
    );
    setEventType(detail.eventType);
    setStartTime(toLocalInputValue(detail.startTime));
    setEndTime(toLocalInputValue(detail.endTime));
    setRegOpensAt(toLocalInputValue(detail.registrationOpensAt));
    setRegClosesAt(toLocalInputValue(detail.registrationClosesAt));
    setDescription(detail.description ?? '');
    setPosterUrl(detail.posterUrl ?? '');
    setStyles(detail.styles ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        if (cancelled) return;
        setOrg(organizer);
        if (!eventId) {
          if (organizer.city) setCity(organizer.city);
          return;
        }
        const detail = await auth.api.getOrganizerEvent(organizer.id, eventId);
        if (cancelled) return;
        syncFromEvent(detail);
      } catch (err) {
        if (!cancelled) setLoadError(err);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, slug, reloadKey]);

  async function saveBasics() {
    if (!org) return;
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      if (!title.trim()) throw new Error('Add an event name');
      if (!city.trim()) throw new Error('Add a city');
      if (!startTime) throw new Error('Pick a start time');
      const startIso = toIsoFromLocal(startTime);
      const endIso = endTime ? toIsoFromLocal(endTime) : null;
      const opensIso = regOpensAt ? toIsoFromLocal(regOpensAt) : null;
      const closesIso = regClosesAt ? toIsoFromLocal(regClosesAt) : null;
      assertEndAfterStart(startIso, endIso);
      assertRegistrationWindow({
        opensAt: opensIso,
        closesAt: closesIso,
        startTime: startIso,
      });

      if (!event) {
        const created = await auth.api.createOrganizerEvent(org.id, {
          title: title.trim(),
          city: city.trim(),
          venue: venue || undefined,
          venueLatitude: coords?.lat ?? null,
          venueLongitude: coords?.lng ?? null,
          eventType,
          startTime: startIso,
          endTime: endIso ?? undefined,
          registrationOpensAt: opensIso,
          registrationClosesAt: closesIso,
          description: description || undefined,
          posterUrl: posterUrl.trim() || undefined,
          styles: styles.length > 0 ? styles : undefined,
        });
        toastResolve(tid, toastCopy.basicsSaved);
        router.replace(`${routes.organize}/${org.slug}/events/${created.id}?created=1`);
        return;
      }

      const updated = await auth.api.updateOrganizerEvent(org.id, event.id, {
        title: title.trim(),
        city: city.trim(),
        venue: venue || null,
        venueLatitude: coords?.lat ?? null,
        venueLongitude: coords?.lng ?? null,
        eventType,
        startTime: startIso,
        endTime: endIso,
        registrationOpensAt: opensIso,
        registrationClosesAt: closesIso,
        description: description || null,
        posterUrl: posterUrl.trim() || null,
        styles: styles.length > 0 ? styles : [],
      });
      syncFromEvent(updated);
      toastResolve(tid, toastCopy.basicsSaved);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  async function togglePublish() {
    if (!org || !event) return;
    setPending(true);
    const tid = toastPending(toastCopy.publishing);
    try {
      const updated =
        event.status === 'published'
          ? await auth.api.unpublishOrganizerEvent(org.id, event.id)
          : await auth.api.publishOrganizerEvent(org.id, event.id);
      syncFromEvent(updated);
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

  if (loadError && !org) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load organizer"
          error={loadError}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }

  if (!org) {
    return <PageLoading variant="form" className="px-6 py-16" label="Loading editor" />;
  }

  if (loadError && !isCreate && !event) {
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

  if (!isCreate && !event) {
    return <PageLoading variant="form" className="px-6 py-16" label="Loading event" />;
  }

  const viewHref = event
    ? `${routes.organize}/${org.slug}/events/${event.id}`
    : `${routes.organize}/${org.slug}`;
  const entryHref = event ? routes.organizeEventEntry(org.slug, event.id) : null;
  const isPublished = event?.status === 'published';

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 pb-24 md:px-7">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: 'Your Events', href: routes.organize },
          {
            label: !event || !title.trim() ? 'Event' : title.trim() || event.title,
            href: viewHref,
          },
          { label: isFresh ? 'New' : 'Edit' },
        ]}
      />
      <h1 className="display-title text-4xl md:text-5xl">{isFresh ? 'New event' : 'Edit event'}</h1>

      {entryHref ? (
        <p className="text-sm text-text-secondary">
          Competition and audience are under{' '}
          <Link href={entryHref} className="font-semibold text-accent underline underline-offset-2">
            Entry
          </Link>
          .
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#141414] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {!event
              ? 'New draft'
              : isPublished
                ? 'Published'
                : event.status === 'draft'
                  ? 'Draft'
                  : event.status}
          </p>
          <p className="text-xs text-text-secondary">
            {!event
              ? 'Save details first'
              : isPublished
                ? 'Visible on Discover and Events'
                : 'Not visible publicly until you put it up'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={isPublished ? 'lime' : 'muted'}>{event?.status ?? 'draft'}</Badge>
            <Badge variant="outline">{eventType}</Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || !event}
          onClick={() => void togglePublish()}
        >
          {isPublished ? 'Unpublish' : 'Put it up'}
        </Button>
      </div>

      {step === 'media' ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goToStep('basics')}
            className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent"
          >
            ← Back to details
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
            Manage media
          </p>
        </div>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Public details
        </p>
      )}

      {step === 'basics' ? (
        <section id="basics" className="scroll-mt-24 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block space-y-2 text-sm font-semibold text-text-secondary md:col-span-2">
              Event name
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What’s the night called?"
                required
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold text-text-secondary md:col-span-2">
              Event type
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 font-body text-sm text-text-primary"
              >
                {EVENT_TYPE_GROUPS.map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {group.types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {eventTypeHint(eventType) ? (
                <span className="block text-[11px] font-normal text-text-muted">
                  {eventTypeHint(eventType)}
                </span>
              ) : null}
            </label>
            <label className="block space-y-2 text-sm font-semibold text-text-secondary">
              City
              <Input value={city} onChange={(e) => setCity(e.target.value)} required />
            </label>
            <label className="block space-y-2 text-sm font-semibold text-text-secondary">
              Start
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold text-text-secondary">
              End
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <span className="block text-[11px] font-normal text-text-muted">
                Optional — set end on another day for multi-day audience passes
              </span>
            </label>
            <label className="block space-y-2 text-sm font-semibold text-text-secondary">
              Registration opens
              <Input
                type="datetime-local"
                value={regOpensAt}
                onChange={(e) => setRegOpensAt(e.target.value)}
              />
              <span className="block text-[11px] font-normal text-text-muted">
                Optional — leave blank to open immediately when published
              </span>
            </label>
            <label className="block space-y-2 text-sm font-semibold text-text-secondary">
              Registration closes
              <Input
                type="datetime-local"
                value={regClosesAt}
                max={startTime || undefined}
                onChange={(e) => setRegClosesAt(e.target.value)}
              />
              <span className="block text-[11px] font-normal text-text-muted">
                Optional — must be before the night starts
              </span>
            </label>
          </div>
          <VenueMapField
            venueName={venue}
            onVenueNameChange={setVenue}
            coords={coords}
            onCoordsChange={setCoords}
            disabled={pending}
          />
          <PosterField value={posterUrl} onChange={setPosterUrl} disabled={pending} />
          <div className="space-y-2 text-sm font-semibold text-text-secondary">
            <p>
              Dance styles <span className="font-normal text-text-muted">(optional)</span>
            </p>
            <StyleChipsField value={styles} onChange={setStyles} disabled={pending} />
          </div>
          <label className="block space-y-2 text-sm font-semibold text-text-secondary">
            About
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </label>

          {event ? (
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#141414] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                Media
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {(event.mediaLinks ?? []).length} link
                {(event.mediaLinks ?? []).length === 1 ? '' : 's'}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 rounded-xl"
                onClick={() => goToStep('media')}
              >
                Manage media
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button asChild variant="ghost">
              <Link href={viewHref}>{event ? 'Back to event' : 'Cancel'}</Link>
            </Button>
            <Button type="button" disabled={pending} onClick={() => void saveBasics()}>
              Save details
            </Button>
          </div>
        </section>
      ) : null}

      {step === 'media' ? (
        <section id="media" className="scroll-mt-24 space-y-4">
          {!event ? (
            <p className="rounded-md border border-dashed border-border bg-surface px-4 py-6 text-sm text-text-secondary">
              Save event details first — then media unlocks here.
            </p>
          ) : (
            <>
              <EventMediaLinksEditor
                organizerId={org.id}
                eventId={event.id}
                links={event.mediaLinks ?? []}
                categories={event.categories
                  .filter((c) => c.entryType !== 'viewer')
                  .map((c) => ({ id: c.id, name: c.name }))}
                onUpdated={(updated) => syncFromEvent(updated)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => goToStep('basics')}>
                  Back to details
                </Button>
                <Button asChild variant="ghost">
                  <Link href={viewHref}>Done</Link>
                </Button>
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
