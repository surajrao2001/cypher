'use client';

import type {
  EventCategoryPublicDto,
  OrganizerDto,
  OrganizerEventDetailDto,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
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
import {
  capacityUnitLabel,
  earlyBirdTier,
  fillLabel,
  formatFromCategory,
  priceLabel,
  COMPETITION_FORMATS,
} from '@/features/organize/entry-format';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import {
  CapacityMeter,
  ObjectSurface,
  OrganizeEmpty,
  OrganizerWorkspace,
} from '@/features/organize/organizer-ui';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { PageLoading, SoftError, friendlyError } from '@/features/shell/AsyncState';
import { Badge } from '@/components/ui/badge';
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

/** Entry UI without OrganizeGate — for manage tab embedding. */
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
    const label = cat.entryType === 'viewer' ? 'audience pass' : 'competition';
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

  const body =
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
    ) : (
      <EntryList
        compete={compete}
        audienceCats={audienceCats}
        pendingDelete={pendingDelete}
        onAddCompetition={(el) => openPanel({ kind: 'add-competition' }, el)}
        onEditCompetition={(id, el) => openPanel({ kind: 'edit-competition', categoryId: id }, el)}
        onAddAudience={(el) => openPanel({ kind: 'add-audience' }, el)}
        onEditAudience={(id, el) => openPanel({ kind: 'edit-audience', categoryId: id }, el)}
        onRemove={removeCategory}
      />
    );

  if (!showChrome) {
    return <div className="space-y-6">{body}</div>;
  }

  return (
    <OrganizerWorkspace width="default">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: 'Your Events', href: routes.organize },
          { label: event.title, href: manageHref },
          { label: 'Entry' },
        ]}
      />
      {body}
      {panel.kind === 'list' ? (
        <div className="pt-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={manageHref}>Back to event</Link>
          </Button>
        </div>
      ) : null}
    </OrganizerWorkspace>
  );
}

function EntryList({
  compete,
  audienceCats,
  pendingDelete,
  onAddCompetition,
  onEditCompetition,
  onAddAudience,
  onEditAudience,
  onRemove,
}: {
  compete: EventCategoryPublicDto[];
  audienceCats: EventCategoryPublicDto[];
  pendingDelete: string | null;
  onAddCompetition: (trigger: HTMLElement | null) => void;
  onEditCompetition: (id: string, trigger: HTMLElement | null) => void;
  onAddAudience: (trigger: HTMLElement | null) => void;
  onEditAudience: (id: string, trigger: HTMLElement | null) => void;
  onRemove: (cat: EventCategoryPublicDto) => void;
}) {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="display-title text-4xl md:text-5xl">Entry</h1>
          <p className="text-sm text-text-secondary">How can people get in?</p>
        </div>
        <Button
          type="button"
          onClick={(e) => onAddCompetition(e.currentTarget)}
        >
          + Add competition
        </Button>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Competition{compete.length > 0 ? ` · ${String(compete.length)}` : ''}
        </h2>
        {compete.length === 0 ? (
          <OrganizeEmpty
            title="No competition yet"
            body="Add formats so people can compete."
            className="py-4"
          >
            <Button
              type="button"
              variant="outline"
              onClick={(e) => onAddCompetition(e.currentTarget)}
            >
              + Add competition
            </Button>
          </OrganizeEmpty>
        ) : (
          <ul className="space-y-3">
            {compete.map((cat) => (
              <EntryObject
                key={cat.id}
                cat={cat}
                busy={pendingDelete === cat.id}
                onEdit={(el) => onEditCompetition(cat.id, el)}
                onRemove={() => onRemove(cat)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Audience
        </h2>
        {audienceCats.length === 0 ? (
          <OrganizeEmpty
            title="No audience pass"
            body="Add one if people can come to watch."
            className="py-4"
          >
            <Button
              type="button"
              variant="outline"
              onClick={(e) => onAddAudience(e.currentTarget)}
            >
              + Add audience pass
            </Button>
          </OrganizeEmpty>
        ) : (
          <ul className="space-y-3">
            {audienceCats.map((cat) => (
              <EntryObject
                key={cat.id}
                cat={cat}
                busy={pendingDelete === cat.id}
                onEdit={(el) => onEditAudience(cat.id, el)}
                onRemove={() => onRemove(cat)}
              />
            ))}
          </ul>
        )}
        {audienceCats.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={(e) => onAddAudience(e.currentTarget)}
          >
            + Add audience pass
          </Button>
        ) : null}
      </section>
    </div>
  );
}

function EntryObject({
  cat,
  busy,
  onEdit,
  onRemove,
}: {
  cat: EventCategoryPublicDto;
  busy: boolean;
  onEdit: (trigger: HTMLElement | null) => void;
  onRemove: () => void;
}) {
  const occupied = cat.reservedCount + cat.confirmedCount;
  const canRemove = occupied === 0;
  const early = earlyBirdTier(cat).early;
  const unit = capacityUnitLabel(cat);
  const sell = cat.currentPriceMinor ?? cat.priceMinor;
  const formatId = formatFromCategory(cat);
  const formatLabel =
    cat.entryType === 'viewer'
      ? null
      : COMPETITION_FORMATS.find((f) => f.id === formatId)?.label ??
        (formatId === 'custom' ? 'Custom' : null);
  const isPaid = sell > 0;

  return (
    <li>
      <ObjectSurface className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-xl uppercase tracking-[0.04em] text-text-primary sm:text-2xl">
                {cat.name}
              </p>
              {formatLabel ? <Badge variant="outline">{formatLabel}</Badge> : null}
              <Badge variant={isPaid ? 'outline' : 'muted'}>{isPaid ? 'Paid' : 'Free'}</Badge>
            </div>
            <p className="text-sm text-text-secondary">
              {priceLabel(sell)}
              {early ? ` · early ${priceLabel(early.priceMinor)}` : ''}
              {' · '}
              {fillLabel(cat.confirmedCount, cat.capacity)}
              <span className="text-text-muted"> ({unit})</span>
            </p>
            <CapacityMeter filled={cat.confirmedCount} capacity={cat.capacity} className="max-w-md" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={(e) => onEdit(e.currentTarget)}
            >
              Edit
            </Button>
            <Dropdown>
              <DropdownTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  aria-label="More actions"
                >
                  ···
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
      </ObjectSurface>
    </li>
  );
}

