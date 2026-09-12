'use client';

import type {
  EventCategoryPublicDto,
  OrganizerDto,
  OrganizerEventDetailDto,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/ui/dropdown';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { AudienceEntryForm } from '@/features/organize/AudienceEntryForm';
import { CompetitionEntryForm } from '@/features/organize/CompetitionEntryForm';
import {
  earlyBirdTier,
  fillLabel,
  formatFromCategory,
  priceLabel,
  COMPETITION_FORMATS,
} from '@/features/organize/entry-format';
import {
  entryCopyForType,
  eventTypeGroup,
} from '@/features/organize/event-type-copy';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import {
  CapacityMeter,
  OrganizeEmpty,
  OrganizerWorkspace,
} from '@/features/organize/organizer-ui';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { PageLoading, SoftError, friendlyError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type Panel =
  | { kind: 'list' }
  | { kind: 'add-competition' }
  | { kind: 'edit-competition'; categoryId: string }
  | { kind: 'add-audience' }
  | { kind: 'edit-audience'; categoryId: string };

export function EventEntryView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventEntryPanel slug={slug} eventId={eventId} showChrome />
    </OrganizeGate>
  );
}

/** Entry UI — prefer dedicated `/entry` route (full page). */
export function EventEntryPanel({
  slug,
  eventId,
  showChrome = false,
  initialPanel,
}: {
  slug: string;
  eventId: string;
  showChrome?: boolean;
  initialPanel?: Panel;
}) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [panel, setPanel] = useState<Panel>(initialPanel ?? { kind: 'list' });
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function openPanel(next: Panel, trigger?: HTMLElement | null) {
    returnFocusRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    setPanel(next);
  }

  function closePanel(nextEvent?: OrganizerEventDetailDto) {
    if (nextEvent) setEvent(nextEvent);
    setPanel({ kind: 'list' });
    window.requestAnimationFrame(() => {
      returnFocusRef.current?.focus?.();
      returnFocusRef.current = null;
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        const detail = await auth.api.getOrganizerEvent(organizer.id, eventId);
        if (cancelled) return;
        setOrg(organizer);
        setEvent(detail);
      } catch (err) {
        if (!cancelled) setLoadError(err);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, slug, reloadKey]);

  useEffect(() => {
    if (!org) return;
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
  }, [auth.api, org]);

  const compete = useMemo(
    () =>
      event?.competeCategories ??
      (event?.categories ?? []).filter((c) => c.entryType !== 'viewer'),
    [event],
  );
  const audienceCats = useMemo(
    () =>
      event?.viewerCategories ??
      (event?.categories ?? []).filter((c) => c.entryType === 'viewer'),
    [event],
  );

  async function removeCategory(cat: EventCategoryPublicDto) {
    if (!org || !event) return;
    const copy = entryCopyForType(event.eventType);
    const label = cat.entryType === 'viewer' ? 'audience pass' : copy.competeTitle.toLowerCase();
    if (!window.confirm(`Remove “${cat.name}” ${label}?`)) return;
    setPendingDelete(cat.id);
    const tid = toastPending(toastCopy.saving);
    try {
      const next = await auth.api.deleteOrganizerEventCategory(org.id, event.id, cat.id);
      setEvent(next);
      toastResolve(
        tid,
        cat.entryType === 'viewer'
          ? toastCopy.audienceRemoved
          : toastCopy.categoryDeleted(cat.name),
      );
      setPanel({ kind: 'list' });
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, friendlyError(err));
    } finally {
      setPendingDelete(null);
    }
  }

  if (loadError && !event) {
    return (
      <div className={showChrome ? 'px-6 py-16' : 'py-8'}>
        <SoftError
          title="Couldn’t load entry"
          error={loadError}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }

  if (!org || !event) {
    return (
      <PageLoading
        variant="detail"
        className={showChrome ? 'px-6 py-16' : 'py-8'}
        label="Loading entry"
      />
    );
  }

  const manageHref = `${routes.organize}/${org.slug}/events/${event.id}`;
  const editingCompete =
    panel.kind === 'edit-competition'
      ? compete.find((c) => c.id === panel.categoryId)
      : null;
  const editingAudience =
    panel.kind === 'edit-audience'
      ? audienceCats.find((c) => c.id === panel.categoryId)
      : null;
  const formOpen =
    panel.kind === 'add-competition' ||
    panel.kind === 'edit-competition' ||
    panel.kind === 'add-audience' ||
    panel.kind === 'edit-audience';

  const form =
    panel.kind === 'add-competition' || panel.kind === 'edit-competition' ? (
      <CompetitionEntryForm
        organizerId={org.id}
        orgSlug={org.slug}
        eventId={event.id}
        event={event}
        payoutReady={payoutReady}
        category={editingCompete}
        onUpdated={(next) => closePanel(next)}
        onCancel={() => closePanel()}
      />
    ) : panel.kind === 'add-audience' || panel.kind === 'edit-audience' ? (
      <AudienceEntryForm
        organizerId={org.id}
        orgSlug={org.slug}
        eventId={event.id}
        event={event}
        payoutReady={payoutReady}
        category={editingAudience}
        onUpdated={(next) => closePanel(next)}
        onCancel={() => closePanel()}
      />
    ) : null;

  const list = (
    <EntryList
      eventType={event.eventType}
      compete={compete}
      audienceCats={audienceCats}
      posterUrl={event.posterUrl}
      pendingDelete={pendingDelete}
      onAddCompetition={(el) => openPanel({ kind: 'add-competition' }, el)}
      onEditCompetition={(id, el) => openPanel({ kind: 'edit-competition', categoryId: id }, el)}
      onAddAudience={(el) => openPanel({ kind: 'add-audience' }, el)}
      onEditAudience={(id, el) => openPanel({ kind: 'edit-audience', categoryId: id }, el)}
      onRemove={removeCategory}
    />
  );

  const body = (
    <div
      className={cn(
        formOpen && 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start',
      )}
    >
      <div className={cn(formOpen && 'hidden lg:block lg:opacity-45 lg:pointer-events-none')}>
        {list}
      </div>
      {formOpen && form ? (
        <aside className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4 sm:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <button
            type="button"
            onClick={() => closePanel()}
            className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent lg:hidden"
          >
            <ByndIcon name="chevronLeft" className="size-4" />
            Back to Entry
          </button>
          {form}
        </aside>
      ) : null}
    </div>
  );

  const content = (
    <>
      {showChrome ? (
        <PageBreadcrumb
          items={[
            { label: event.title, href: manageHref },
            { label: 'Entry' },
          ]}
        />
      ) : null}
      {body}
    </>
  );

  if (!showChrome) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <div className="relative before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[28rem] before:bg-[radial-gradient(ellipse_at_top_right,rgba(255,104,0,0.28)_0%,rgba(255,104,0,0.08)_35%,transparent_70%)] before:content-['']">
      <OrganizerWorkspace width="full" className="relative z-10 space-y-6">
        {content}
      </OrganizerWorkspace>
    </div>
  );
}

function EntryList({
  eventType,
  compete,
  audienceCats,
  posterUrl,
  pendingDelete,
  onAddCompetition,
  onEditCompetition,
  onAddAudience,
  onEditAudience,
  onRemove,
}: {
  eventType: string;
  compete: EventCategoryPublicDto[];
  audienceCats: EventCategoryPublicDto[];
  posterUrl: string | null;
  pendingDelete: string | null;
  onAddCompetition: (trigger: HTMLElement | null) => void;
  onEditCompetition: (id: string, trigger: HTMLElement | null) => void;
  onAddAudience: (trigger: HTMLElement | null) => void;
  onEditAudience: (id: string, trigger: HTMLElement | null) => void;
  onRemove: (cat: EventCategoryPublicDto) => void;
}) {
  const copy = entryCopyForType(eventType);
  const group = eventTypeGroup(eventType);
  const anyEntry = compete.length + audienceCats.length > 0;
  const entryOptional = group === 'jam' || group === 'session' || group === 'other';
  const showAudienceSection = group === 'battle' || audienceCats.length > 0;
  const showCompeteEmpty = group === 'battle' || group === 'workshop' || anyEntry;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="display-title text-[2.75rem] leading-[0.9] tracking-[0.04em] sm:text-6xl md:text-7xl">
            Entry
          </h1>
          <p className="text-[15px] text-text-secondary sm:text-base">
            {entryOptional && !anyEntry
              ? 'Optional — add entry if you need capacity or payment.'
              : 'How can people get in?'}
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="h-12 shrink-0 rounded-xl px-6 text-sm tracking-[0.12em]"
          onClick={(e) => onAddCompetition(e.currentTarget)}
        >
          {copy.addCompete}
        </Button>
      </header>

      {entryOptional && !anyEntry ? (
        <OrganizeEmpty
          title="No registration needed"
          body="Want to limit spots or charge entry?"
          className="py-6"
        >
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={(e) => onAddCompetition(e.currentTarget)}
          >
            {copy.addCompete}
          </Button>
        </OrganizeEmpty>
      ) : (
        <>
          {(showCompeteEmpty || compete.length > 0) && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                {copy.competeTitle}
                {compete.length > 0 ? ` (${String(compete.length)})` : ''}
              </h2>
              {compete.length === 0 ? (
                <OrganizeEmpty
                  title={copy.emptyCompeteTitle}
                  body={copy.emptyCompeteBody}
                  className="py-4"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={(e) => onAddCompetition(e.currentTarget)}
                  >
                    {copy.addCompete}
                  </Button>
                </OrganizeEmpty>
              ) : (
                <ul className="space-y-3">
                  {compete.map((cat) => (
                    <EntryObject
                      key={cat.id}
                      cat={cat}
                      fallbackPosterUrl={posterUrl}
                      busy={pendingDelete === cat.id}
                      onEdit={(el) => onEditCompetition(cat.id, el)}
                      onRemove={() => onRemove(cat)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}

          {showAudienceSection ? (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                {copy.audienceTitle}
              </h2>
              {audienceCats.length === 0 ? (
                <button
                  type="button"
                  onClick={(e) => onAddAudience(e.currentTarget)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2a2a2a] bg-transparent px-4 py-5 text-sm font-semibold text-text-primary transition-colors hover:border-accent/40"
                >
                  <span className="text-accent">+</span> {copy.addAudience.replace(/^\+\s*/, '')}
                </button>
              ) : (
                <>
                  <ul className="space-y-3">
                    {audienceCats.map((cat) => (
                      <EntryObject
                        key={cat.id}
                        cat={cat}
                        fallbackPosterUrl={posterUrl}
                        busy={pendingDelete === cat.id}
                        onEdit={(el) => onEditAudience(cat.id, el)}
                        onRemove={() => onRemove(cat)}
                      />
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={(e) => onAddAudience(e.currentTarget)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2a2a2a] bg-transparent px-4 py-4 text-sm font-semibold text-text-primary transition-colors hover:border-accent/40 sm:w-auto sm:px-6"
                  >
                    <span className="text-accent">+</span> {copy.addAudience.replace(/^\+\s*/, '')}
                  </button>
                </>
              )}
            </section>
          ) : anyEntry ? (
            <button
              type="button"
              onClick={(e) => onAddAudience(e.currentTarget)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#2a2a2a] bg-transparent px-4 py-4 text-sm font-semibold text-text-muted transition-colors hover:border-accent/40 hover:text-text-primary sm:w-auto sm:px-6"
            >
              <span className="text-accent">+</span> {copy.addAudience.replace(/^\+\s*/, '')}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function EntryObject({
  cat,
  fallbackPosterUrl,
  busy,
  onEdit,
  onRemove,
}: {
  cat: EventCategoryPublicDto;
  fallbackPosterUrl: string | null;
  busy: boolean;
  onEdit: (trigger: HTMLElement | null) => void;
  onRemove: () => void;
}) {
  const occupied = cat.reservedCount + cat.confirmedCount;
  const canRemove = occupied === 0;
  const early = earlyBirdTier(cat).early;
  const sell = cat.currentPriceMinor ?? cat.priceMinor;
  const formatId = formatFromCategory(cat);
  const formatLabel =
    cat.entryType === 'viewer'
      ? null
      : COMPETITION_FORMATS.find((f) => f.id === formatId)?.label ??
        (formatId === 'custom' ? 'Custom' : null);
  const isPaid = sell > 0;
  const thumb = cat.posterUrl || fallbackPosterUrl;

  return (
    <li>
      <div className="flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#141414] p-3.5 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(160deg,#1c1207,#141414)] sm:h-[5.5rem] sm:w-[5.5rem]">
          {thumb ? (
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ByndIcon name="tickets" className="size-6 text-text-muted/50" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-xl uppercase tracking-[0.04em] text-text-primary sm:text-2xl">
              {cat.name}
            </p>
            {formatLabel ? (
              <span className="rounded-full bg-[#1e1e1e] px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
                {formatLabel}
              </span>
            ) : null}
            <span className="rounded-full bg-[#1e1e1e] px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
              {isPaid ? 'Paid' : 'Free'}
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            {priceLabel(sell)}
            {early ? ` · early ${priceLabel(early.priceMinor)}` : ''}
            {' · '}
            {fillLabel(cat.confirmedCount, cat.capacity)}
          </p>
          <CapacityMeter
            filled={cat.confirmedCount}
            capacity={cat.capacity}
            className="h-1.5 max-w-xl"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={(e) => onEdit(e.currentTarget)}
            className="h-9 rounded-lg border-[#2a2a2a] px-4"
          >
            Edit
          </Button>
          <Dropdown>
            <DropdownTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={busy}
                aria-label="More actions"
                className="size-9 text-accent"
              >
                <ByndIcon name="chevronRight" className="size-4" />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem
                disabled={!canRemove}
                className={cn(!canRemove && 'opacity-40')}
                onSelect={() => {
                  if (canRemove) onRemove();
                }}
              >
                {canRemove ? 'Remove' : 'Has registrations'}
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
    </li>
  );
}
