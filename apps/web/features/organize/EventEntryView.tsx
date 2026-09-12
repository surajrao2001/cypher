'use client';

import type {
  EventCategoryPublicDto,
  OrganizerDto,
  OrganizerEventDetailDto,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import { Eye, MoreHorizontal, Pencil, Plus, Ticket, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

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
import { EditEventDrawer } from '@/features/organize/EditEventDrawer';
import {
  earlyBirdTier,
  fillLabel,
  formatFromCategory,
  priceLabel,
  COMPETITION_FORMATS,
} from '@/features/organize/entry-format';
import { entryCopyForType, eventTypeGroup } from '@/features/organize/event-type-copy';
import {
  OrganizerEmptyBlock,
  OrganizerEventSubHeader,
  OrganizerIconTile,
  OrganizerPill,
  OrganizerTabs,
} from '@/features/organize/organizer-primitives';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { SoftError, friendlyError, PageLoading } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type Panel =
  | { kind: 'list' }
  | { kind: 'add-competition' }
  | { kind: 'edit-competition'; categoryId: string }
  | { kind: 'add-audience' }
  | { kind: 'edit-audience'; categoryId: string };

type EntryTab = 'competitions' | 'audience';

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
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<EntryTab>('competitions');
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

  useEffect(() => {
    if (!event) return;
    const group = eventTypeGroup(event.eventType);
    if (group !== 'battle' && compete.length === 0 && audienceCats.length > 0) {
      setTab('audience');
    }
  }, [audienceCats.length, compete.length, event]);

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

  const peopleHref = routes.organizeEventPeople(org.slug, event.id);
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

  const group = eventTypeGroup(event.eventType);
  const showAudienceTab = group === 'battle' || audienceCats.length > 0 || group === 'other';

  const list = (
    <EntryList
      eventType={event.eventType}
      compete={compete}
      audienceCats={audienceCats}
      tab={tab}
      onTabChange={setTab}
      showAudienceTab={showAudienceTab}
      eventLive={event.status === 'published'}
      peopleHref={peopleHref}
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
        <aside className="rounded-xl border border-white/[0.09] bg-[#141514] p-4 sm:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <button
            type="button"
            onClick={() => closePanel()}
            className="mb-3 inline-flex items-center gap-1 text-sm text-white/45 transition-colors hover:text-accent lg:hidden"
          >
            ← Back to Entry
          </button>
          {form}
        </aside>
      ) : null}
    </div>
  );

  if (!showChrome) {
    return <div className="space-y-6">{body}</div>;
  }

  return (
    <div className="relative min-h-[70vh] bg-[#080908]">
      <OrganizerWorkspace width="canvas" className="relative z-10 space-y-5 sm:space-y-6">
        <OrganizerEventSubHeader
          org={org}
          event={event}
          sectionLabel="Entry"
          onEditEvent={() => setEditOpen(true)}
        />
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
        {body}
      </OrganizerWorkspace>
    </div>
  );
}

function EntryList({
  eventType,
  compete,
  audienceCats,
  tab,
  onTabChange,
  showAudienceTab,
  eventLive,
  peopleHref,
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
  tab: EntryTab;
  onTabChange: (tab: EntryTab) => void;
  showAudienceTab: boolean;
  eventLive: boolean;
  peopleHref: string;
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

  const tabs: Array<{ id: EntryTab; label: string; count: number }> = [
    { id: 'competitions', label: copy.competeTitle, count: compete.length },
  ];
  if (showAudienceTab) {
    tabs.push({ id: 'audience', label: copy.audienceTitle, count: audienceCats.length });
  }

  if (entryOptional && !anyEntry) {
    return (
      <OrganizerEmptyBlock
        title="No registration needed"
        body="Want to limit spots or charge entry?"
      >
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-white/15"
          onClick={(e) => onAddCompetition(e.currentTarget)}
        >
          {copy.addCompete}
        </Button>
      </OrganizerEmptyBlock>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {tabs.length > 1 ? (
        <OrganizerTabs
          ariaLabel="Entry type"
          items={tabs}
          value={tab}
          onChange={onTabChange}
        />
      ) : (
        <h2 className="display-title text-[1.35rem] tracking-[0.04em] text-[#F4F4F1] sm:text-[1.6rem]">
          {copy.competeTitle}
          {compete.length > 0 ? (
            <span className="ml-2 text-[13px] font-semibold text-white/35">
              ({compete.length})
            </span>
          ) : null}
        </h2>
      )}

      {tab === 'competitions' || !showAudienceTab ? (
        <div className="space-y-3">
          {compete.length === 0 ? (
            <OrganizerEmptyBlock title={copy.emptyCompeteTitle} body={copy.emptyCompeteBody}>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-white/15"
                onClick={(e) => onAddCompetition(e.currentTarget)}
              >
                {copy.addCompete}
              </Button>
            </OrganizerEmptyBlock>
          ) : (
            <ul className="space-y-3">
              {compete.map((cat) => (
                <EntryObject
                  key={cat.id}
                  cat={cat}
                  eventLive={eventLive}
                  peopleHref={peopleHref}
                  busy={pendingDelete === cat.id}
                  onEdit={(el) => onEditCompetition(cat.id, el)}
                  onRemove={() => onRemove(cat)}
                />
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={(e) => onAddCompetition(e.currentTarget)}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-transparent text-[13px] font-bold uppercase tracking-[0.12em] text-[#F4F4F1] transition-colors duration-150 hover:border-accent/40 hover:text-accent"
          >
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            {copy.addCompete.replace(/^\+\s*/, '')}
          </button>
          <p className="text-[12px] text-white/42">
            You can add multiple competitions with different formats and entry fees.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audienceCats.length === 0 ? (
            <OrganizerEmptyBlock
              title="No audience pass yet"
              body="Add a pass so non-competitors can attend."
            >
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-white/15"
                onClick={(e) => onAddAudience(e.currentTarget)}
              >
                {copy.addAudience}
              </Button>
            </OrganizerEmptyBlock>
          ) : (
            <ul className="space-y-3">
              {audienceCats.map((cat) => (
                <EntryObject
                  key={cat.id}
                  cat={cat}
                  eventLive={eventLive}
                  peopleHref={peopleHref}
                  busy={pendingDelete === cat.id}
                  onEdit={(el) => onEditAudience(cat.id, el)}
                  onRemove={() => onRemove(cat)}
                />
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={(e) => onAddAudience(e.currentTarget)}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-transparent text-[13px] font-bold uppercase tracking-[0.12em] text-[#F4F4F1] transition-colors duration-150 hover:border-accent/40 hover:text-accent"
          >
            <Plus className="size-4" strokeWidth={1.75} aria-hidden />
            {copy.addAudience.replace(/^\+\s*/, '')}
          </button>
        </div>
      )}
    </div>
  );
}

function EntryObject({
  cat,
  eventLive,
  peopleHref,
  busy,
  onEdit,
  onRemove,
}: {
  cat: EventCategoryPublicDto;
  eventLive: boolean;
  peopleHref: string;
  busy: boolean;
  onEdit: (trigger: HTMLElement | null) => void;
  onRemove: () => void;
}) {
  const occupied = cat.reservedCount + cat.confirmedCount;
  const spotsLeft = Math.max(0, cat.capacity - occupied);
  const canRemove = occupied === 0;
  const early = earlyBirdTier(cat).early;
  const sell = cat.currentPriceMinor ?? cat.priceMinor;
  const formatId = formatFromCategory(cat);
  const formatLabel =
    cat.entryType === 'viewer'
      ? null
      : COMPETITION_FORMATS.find((f) => f.id === formatId)?.label ??
        (formatId === 'custom' ? 'Custom' : null);
  const isViewer = cat.entryType === 'viewer';
  const Icon = isViewer ? Ticket : Trophy;
  const tileLabel =
    formatLabel?.replace(/\s+/g, '')?.slice(0, 4)?.toUpperCase() ||
    (isViewer ? 'PASS' : 'ENTRY');

  return (
    <li>
      <div className="group flex flex-col gap-3.5 rounded-xl border border-white/[0.08] bg-[#141514] p-3.5 transition-[border-color,background-color] duration-150 hover:border-white/[0.14] sm:min-h-[7.25rem] sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        {cat.posterUrl ? (
          <div className="relative h-[5.5rem] w-[4.25rem] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#111211] sm:h-[6.25rem] sm:w-[4.75rem]">
            <img src={cat.posterUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <OrganizerIconTile icon={Icon} label={tileLabel} className="h-[5.5rem] w-[4.25rem] sm:h-[6.25rem] sm:w-[4.75rem]" />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-[15px] uppercase tracking-[0.06em] text-[#F4F4F1] sm:text-[16px]">
              {cat.name}
            </p>
            {eventLive ? <OrganizerPill tone="live">Live</OrganizerPill> : null}
          </div>
          <p className="text-[13px] text-white/65">
            {cat.capacity} spots · {cat.confirmedCount} filled
          </p>
          <p className="text-[13px] text-white/55">
            {sell > 0 ? `${formatMinorUnits(sell)} entry fee` : 'Free'}
            {early ? ` · early ${priceLabel(early.priceMinor)}` : ''}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-white/42">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" strokeWidth={1.75} aria-hidden />
              {cat.confirmedCount} registered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Ticket className="size-3.5" strokeWidth={1.75} aria-hidden />
              {spotsLeft} spots left
            </span>
            <span className="sr-only">{fillLabel(cat.confirmedCount, cat.capacity)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-stretch sm:flex-col sm:items-stretch sm:justify-center sm:self-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={(e) => onEdit(e.currentTarget)}
            className="h-9 flex-1 gap-1.5 rounded-md border-white/12 bg-[#111211] px-3 text-[12px] font-semibold sm:flex-none sm:min-w-[7.5rem]"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
            Edit
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden h-9 gap-1.5 rounded-md border-white/12 bg-transparent px-3 text-[12px] font-semibold sm:inline-flex sm:min-w-[7.5rem]"
          >
            <Link href={peopleHref}>
              <Eye className="size-3.5" strokeWidth={1.75} aria-hidden />
              View regs
            </Link>
          </Button>
          <Dropdown>
            <DropdownTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={busy}
                aria-label="More actions"
                className="size-9 text-white/55 hover:text-[#F4F4F1] sm:hidden"
              >
                <MoreHorizontal className="size-4" strokeWidth={1.75} />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onSelect={() => { window.location.href = peopleHref; }}>
                View registrations
              </DropdownItem>
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
          <div className="hidden sm:block">
            <Dropdown>
              <DropdownTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={busy}
                  aria-label="More actions"
                  className="size-8 text-white/45 hover:text-[#F4F4F1]"
                >
                  <MoreHorizontal className="size-4" strokeWidth={1.75} />
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
      </div>
    </li>
  );
}
