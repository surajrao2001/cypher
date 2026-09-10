'use client';

import { routes } from '@cypher/contracts';
import type { EventType, OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { assertEndAfterStart, assertRegistrationWindow } from '@cypher/validation';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastError, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { EventMediaLinksEditor } from '@/features/organize/EventMediaLinksEditor';
import { EVENT_TYPE_GROUPS, eventTypeHint } from '@/features/organize/event-taxonomy';
import { CategoryNameSuggestions } from '@/features/organize/CategoryNameSuggestions';
import {
  EventDaysPricingPanel,
  spansMultipleCalendarDays,
} from '@/features/organize/EventDaysPricingPanel';
import { EventEarlyBirdPanel } from '@/features/organize/EventEarlyBirdPanel';
import {
  EVENT_EDIT_STEPS,
  EventEditStepper,
  isEventEditStepId,
  type EventEditStepId,
} from '@/features/organize/EventEditStepper';
import { EventEditNextSteps } from '@/features/organize/EventEditNextSteps';
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

/** Next Saturday 6pm local, for new-night defaults. */
function defaultStartLocal(): string {
  const d = new Date();
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  d.setHours(18, 0, 0, 0);
  return toLocalInputValue(d.toISOString());
}

function stepFromHash(): EventEditStepId {
  if (typeof window === 'undefined') return 'basics';
  const raw = window.location.hash.replace(/^#/, '');
  return isEventEditStepId(raw) ? raw : 'basics';
}

type CategoryEdit = {
  id: string;
  name: string;
  capacity: string;
  priceRupees: string;
  teamSize: string;
  reservedCount: number;
  confirmedCount: number;
};

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
  const [styles, setStyles] = useState<string[]>(() => (isCreate ? ['Breaking'] : []));
  const [categoryEdits, setCategoryEdits] = useState<CategoryEdit[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCapacity, setNewCatCapacity] = useState('32');
  const [newCatPrice, setNewCatPrice] = useState('0');
  const [newCatTeam, setNewCatTeam] = useState('1');
  const [audienceEnabled, setAudienceEnabled] = useState(false);
  const [audiencePrice, setAudiencePrice] = useState('0');
  const [audienceCapacity, setAudienceCapacity] = useState('100');
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [step, setStep] = useState<EventEditStepId>('basics');

  function goToStep(next: EventEditStepId) {
    setStep(next);
    if (typeof window !== 'undefined') {
      const url = `${window.location.pathname}${window.location.search}#${next}`;
      window.history.replaceState(null, '', url);
      // Scroll so the step names are in view, not just the body
      window.requestAnimationFrame(() => {
        const el = document.getElementById('edit-steps');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  useEffect(() => {
    setStep(stepFromHash());
    function onHashChange() {
      setStep(stepFromHash());
      window.requestAnimationFrame(() => {
        const el = document.getElementById('edit-steps');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
    const audience = detail.audience;
    setAudienceEnabled(Boolean(audience?.enabled));
    setAudiencePrice(String(Math.round((audience?.priceMinor ?? 0) / 100)));
    setAudienceCapacity(String(audience?.capacity || 100));
    setCategoryEdits(
      detail.categories
        .filter((cat) => cat.entryType !== 'viewer')
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          capacity: String(cat.capacity),
          priceRupees: String(Math.round(cat.priceMinor / 100)),
          teamSize: String(cat.teamSize),
          reservedCount: cat.reservedCount,
          confirmedCount: cat.confirmedCount,
        })),
    );
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
        if (!cancelled) {
          setLoadError(err);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, slug, reloadKey]);

  const isMultiDay = useMemo(() => {
    if (!event) return false;
    return spansMultipleCalendarDays(event.startTime, event.endTime) || event.days.length >= 2;
  }, [event]);

  const stepIndex = EVENT_EDIT_STEPS.findIndex((s) => s.id === step);
  const prevStep = stepIndex > 0 ? EVENT_EDIT_STEPS[stepIndex - 1]?.id : null;
  const nextStep =
    stepIndex >= 0 && stepIndex < EVENT_EDIT_STEPS.length - 1
      ? EVENT_EDIT_STEPS[stepIndex + 1]?.id
      : null;

  /** What’s cooking — create draft on first save, then update. */
  async function saveBasics() {
    if (!org) return;
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      if (!title.trim()) {
        throw new Error('Name the night first');
      }
      if (!city.trim()) {
        throw new Error('Say which city');
      }
      if (!startTime) {
        throw new Error('Pick a start time');
      }
      if (styles.length === 0) {
        throw new Error('Add at least one dance style');
      }
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
          styles,
        });
        toastResolve(tid, toastCopy.basicsSaved);
        router.replace(`${routes.organize}/${org.slug}/events/${created.id}/edit?fresh=1`);
        return;
      }

      // Omit audiencePass here: single-day viewers save on the Viewers step;
      // multi-day viewers come from EventDaysPricingPanel generate — don't toggle a conflicting pass.
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
        styles,
      });
      syncFromEvent(updated);
      toastResolve(tid, toastCopy.basicsSaved);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  async function saveViewersPass() {
    if (!org || !event || isMultiDay) return;
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      const updated = await auth.api.updateOrganizerEvent(org.id, event.id, {
        audiencePass: {
          enabled: audienceEnabled,
          priceMinor: Math.round(Number(audiencePrice || 0) * 100),
          capacity: Number(audienceCapacity || 100),
          name: 'Viewers pass',
        },
      });
      syncFromEvent(updated);
      toastResolve(tid, audienceEnabled ? toastCopy.viewersOn : toastCopy.viewersOff);
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

  async function saveCategory(row: CategoryEdit) {
    if (!org || !event) return;
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      const updated = await auth.api.updateOrganizerEventCategory(org.id, event.id, row.id, {
        name: row.name.trim(),
        capacity: Number(row.capacity),
        priceMinor: Math.round(Number(row.priceRupees || 0) * 100),
        teamSize: Number(row.teamSize || 1),
      });
      syncFromEvent(updated);
      toastResolve(tid, toastCopy.categoryUpdated(row.name.trim()));
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  async function removeCategory(row: CategoryEdit) {
    if (!org || !event) return;
    if (!window.confirm(`Delete category “${row.name}”?`)) return;
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      const updated = await auth.api.deleteOrganizerEventCategory(org.id, event.id, row.id);
      syncFromEvent(updated);
      toastResolve(tid, toastCopy.categoryDeleted(row.name));
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  async function addCategory() {
    if (!org || !event) return;
    const name = newCatName.trim();
    if (!name) {
      toastError(toastCopy.categoryNameNeeded);
      return;
    }
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      const updated = await auth.api.addOrganizerEventCategory(org.id, event.id, {
        name,
        capacity: Number(newCatCapacity),
        priceMinor: Math.round(Number(newCatPrice || 0) * 100),
        teamSize: Number(newCatTeam || 1),
      });
      syncFromEvent(updated);
      setNewCatName('');
      setNewCatCapacity('32');
      setNewCatPrice('0');
      setNewCatTeam('1');
      toastResolve(tid, toastCopy.categoryAdded);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
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
  const isPublished = event?.status === 'published';
  const hasViewerCats = (event?.viewerCategories?.length ?? 0) > 0;
  const saveWhatsCookingFirst = (
    <p className="rounded-md border border-dashed border-border bg-surface px-4 py-6 text-sm text-text-secondary">
      Save <span className="font-semibold text-text-primary">What’s cooking</span> first — then
      categories, viewers, early bird, and media unlock here.
    </p>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 pb-24 md:px-7">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: org.orgName, href: `${routes.organize}/${org.slug}` },
          {
            label:
              !event || event.title === 'Untitled night' || !title.trim()
                ? 'New night'
                : title.trim() || event.title,
            href: viewHref,
          },
          { label: isFresh ? 'New' : 'Edit' },
        ]}
      />
      <h1 className="display-title text-4xl md:text-5xl">
        {isFresh ? 'New night' : 'Edit event'}
      </h1>

      {event ? (
        <Suspense fallback={null}>
          <EventEditNextSteps
            checklist={{
              hasCategories: categoryEdits.length > 0,
              hasViewersPass:
                audienceEnabled || Boolean(event.audience?.enabled) || hasViewerCats,
              hasPoster: Boolean(posterUrl.trim() || event.posterUrl),
              hasVenuePin: coords != null,
              hasMedia: (event.mediaLinks?.length ?? 0) > 0,
              isDraft: event.status === 'draft',
            }}
          />
        </Suspense>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
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
              ? 'Fill What’s cooking and save — then add categories and the rest'
              : isPublished
                ? 'Visible on Discover and Events'
                : 'Not visible publicly until you publish'}
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
          {isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      </div>

      <EventEditStepper active={step} onChange={goToStep} />

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
                Optional — set end on another day for multi-day pricing
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
            <p>Dance styles</p>
            <StyleChipsField value={styles} onChange={setStyles} disabled={pending} />
          </div>
          <label className="block space-y-2 text-sm font-semibold text-text-secondary">
            About this night
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button asChild variant="ghost">
              <Link href={viewHref}>{event ? 'Back to event' : 'Cancel'}</Link>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={pending} onClick={() => void saveBasics()}>
                Save what’s cooking
              </Button>
              {nextStep && event ? (
                <Button type="button" variant="outline" onClick={() => goToStep(nextStep)}>
                  Next
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {step === 'categories' ? (
        <section id="categories" className="scroll-mt-24 space-y-4">
          {!event ? (
            saveWhatsCookingFirst
          ) : (
            <>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-text-primary">Categories</h2>
            <span className="text-[12.5px] text-text-muted">1v1 / crew · prelims · exhibition</span>
          </div>
          <p className="text-xs leading-relaxed text-text-muted">
            How people enter — the format. Solo, pairs, or full crew against another. Tap a chip or
            type your own.
          </p>

          <div className="space-y-3">
            {categoryEdits.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-text-muted">
                No categories yet. Add 1v1 / 2v2 / open below before you publish.
              </p>
            ) : null}
            {categoryEdits.map((row) => {
              const occupied = row.reservedCount + row.confirmedCount;
              const canDelete = occupied === 0;
              return (
                <div key={row.id} className="rounded-lg border border-border bg-surface p-[18px]">
                  <div className="mb-3.5 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-text-primary">{row.name || 'Category'}</p>
                    <button
                      type="button"
                      className="text-xs text-text-muted hover:text-error disabled:opacity-40"
                      disabled={pending || !canDelete}
                      title={!canDelete ? 'Category has reserved/confirmed spots' : undefined}
                      onClick={() => void removeCategory(row)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="block space-y-2 text-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">Category name</span>
                      <CategoryNameSuggestions
                        value={row.name}
                        onPick={(name) =>
                          setCategoryEdits((rows) =>
                            rows.map((item) => (item.id === row.id ? { ...item, name } : item)),
                          )
                        }
                        disabled={pending}
                      />
                      <Input
                        value={row.name}
                        onChange={(e) =>
                          setCategoryEdits((rows) =>
                            rows.map((item) =>
                              item.id === row.id ? { ...item, name: e.target.value } : item,
                            ),
                          )
                        }
                        placeholder="e.g. 1v1, Crew, Prelims"
                      />
                    </label>
                    <label className="block space-y-2 text-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">Spots</span>
                      <Input
                        type="number"
                        min={Math.max(1, occupied)}
                        value={row.capacity}
                        onChange={(e) =>
                          setCategoryEdits((rows) =>
                            rows.map((item) =>
                              item.id === row.id ? { ...item, capacity: e.target.value } : item,
                            ),
                          )
                        }
                      />
                      <span className="block text-[11px] text-text-muted">
                        {occupied} already locked in
                      </span>
                    </label>
                    <label className="block space-y-2 text-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">Team size</span>
                      <span className="block text-[11px] text-text-muted">1 = solo · 2 = duo</span>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={row.teamSize}
                        onChange={(e) =>
                          setCategoryEdits((rows) =>
                            rows.map((item) =>
                              item.id === row.id ? { ...item, teamSize: e.target.value } : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                  <label className="mt-3 block space-y-2 text-sm text-text-secondary sm:max-w-xs">
                    <span className="font-semibold text-text-primary">Fee (₹)</span>
                    <span className="block text-[11px] text-text-muted">
                      0 = free · Early bird is on step 4
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={row.priceRupees}
                      onChange={(e) =>
                        setCategoryEdits((rows) =>
                          rows.map((item) =>
                            item.id === row.id ? { ...item, priceRupees: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="0 for free"
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    disabled={pending}
                    onClick={() => void saveCategory(row)}
                  >
                    Save category
                  </Button>
                </div>
              );
            })}

            <div className="rounded-lg border border-dashed border-border bg-surface/50 p-[18px]">
              <p className="mb-3 text-sm font-bold text-text-primary">+ Add category</p>
              <label className="block space-y-2 text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">Category name</span>
                <CategoryNameSuggestions value={newCatName} onPick={setNewCatName} disabled={pending} />
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Open, Exhibition"
                />
              </label>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block space-y-2 text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">Spots</span>
                  <Input
                    type="number"
                    min={1}
                    value={newCatCapacity}
                    onChange={(e) => setNewCatCapacity(e.target.value)}
                  />
                </label>
                <label className="block space-y-2 text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">Fee (₹)</span>
                  <Input
                    type="number"
                    min={0}
                    value={newCatPrice}
                    onChange={(e) => setNewCatPrice(e.target.value)}
                  />
                </label>
                <label className="block space-y-2 text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">Team size</span>
                  <Input
                    type="number"
                    min={1}
                    value={newCatTeam}
                    onChange={(e) => setNewCatTeam(e.target.value)}
                  />
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={pending}
                onClick={() => void addCategory()}
              >
                Add category
              </Button>
            </div>
          </div>

          <StepNav prev={prevStep} next={nextStep} onGo={goToStep} />
            </>
          )}
        </section>
      ) : null}

      {step === 'viewers' ? (
        <section id="viewers" className="scroll-mt-24 space-y-4">
          {!event ? (
            saveWhatsCookingFirst
          ) : (
            <>
          <h2 className="text-sm font-bold text-text-primary">Viewers</h2>
          {isMultiDay ? (
            <EventDaysPricingPanel
              organizerId={org.id}
              eventId={event.id}
              event={event}
              onUpdated={(updated) => syncFromEvent(updated)}
            />
          ) : (
            <div className="rounded-lg border border-border bg-surface p-[18px] space-y-3">
              <p className="text-sm text-text-secondary">
                For people who come to watch — not compete. Optional if it’s compete-only.
              </p>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border bg-elevated/40 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={audienceEnabled}
                  onChange={(e) => setAudienceEnabled(e.target.checked)}
                />
                <span>
                  <span className="font-semibold text-text-primary">Sell a viewers pass</span>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    Crowd who aren’t entering a category
                  </span>
                </span>
              </label>
              {audienceEnabled ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">Pass fee (₹)</span>
                    <Input
                      type="number"
                      min={0}
                      value={audiencePrice}
                      onChange={(e) => setAudiencePrice(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">Viewer spots</span>
                    <Input
                      type="number"
                      min={1}
                      value={audienceCapacity}
                      onChange={(e) => setAudienceCapacity(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}
              <Button type="button" disabled={pending} onClick={() => void saveViewersPass()}>
                Save viewers pass
              </Button>
            </div>
          )}
          <StepNav prev={prevStep} next={nextStep} onGo={goToStep} />
            </>
          )}
        </section>
      ) : null}

      {step === 'early-bird' ? (
        <section id="early-bird" className="scroll-mt-24 space-y-4">
          {!event ? (
            saveWhatsCookingFirst
          ) : (
            <>
          <EventEarlyBirdPanel
            organizerId={org.id}
            eventId={event.id}
            event={event}
            onUpdated={(updated) => syncFromEvent(updated)}
          />
          <StepNav prev={prevStep} next={nextStep} onGo={goToStep} />
            </>
          )}
        </section>
      ) : null}

      {step === 'media' ? (
        <section id="media" className="scroll-mt-24 space-y-4">
          {!event ? (
            saveWhatsCookingFirst
          ) : (
            <>
          <h2 className="text-sm font-bold text-text-primary">Media</h2>
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
            {prevStep ? (
              <Button type="button" variant="outline" onClick={() => goToStep(prevStep)}>
                Prev
              </Button>
            ) : (
              <span />
            )}
            <Button asChild variant="ghost">
              <Link href={viewHref}>Done — view event</Link>
            </Button>
          </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

function StepNav({
  prev,
  next,
  onGo,
}: {
  prev: EventEditStepId | null | undefined;
  next: EventEditStepId | null | undefined;
  onGo: (step: EventEditStepId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      {prev ? (
        <Button type="button" variant="outline" onClick={() => onGo(prev)}>
          Prev
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button type="button" variant="outline" onClick={() => onGo(next)}>
          Next
        </Button>
      ) : null}
    </div>
  );
}
