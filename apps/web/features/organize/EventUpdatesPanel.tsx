'use client';

import type {
  EventUpdateDto,
  EventUpdateKind,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import {
  ArrowLeft,
  CalendarClock,
  Image as ImageIcon,
  Megaphone,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { EditEventDrawer } from '@/features/organize/EditEventDrawer';
import { PosterField } from '@/features/organize/PosterField';
import {
  OrganizerEmptyBlock,
  OrganizerEventSubHeader,
  OrganizerManageShell,
  OrganizerPill,
  OrganizerSkeletonRows,
  OrganizerTabs,
  relativeUpdateTime,
  type OrganizerPillTone,
} from '@/features/organize/organizer-primitives';
import { formatEventHomeWhen } from '@/features/organize/EventControlHeader';
import { statusLabel } from '@/features/organize/event-control';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import {
  useEventUpdatesQuery,
  useInvalidateOrganize,
  useOrganizerBySlugQuery,
  useOrganizerEventQuery,
} from '@/features/organize/queries';
import { SoftError, friendlyError } from '@/features/shell/AsyncState';

type UpdateFilter = 'all' | 'announcements' | 'schedule' | 'media' | 'other';

function kindMeta(kind: EventUpdateKind): {
  label: string;
  tone: OrganizerPillTone;
  Icon: typeof Megaphone;
  filter: Exclude<UpdateFilter, 'all'>;
} {
  switch (kind) {
    case 'MEDIA':
      return { label: 'Media', tone: 'media', Icon: ImageIcon, filter: 'media' };
    case 'SCHEDULE':
      return { label: 'Schedule', tone: 'schedule', Icon: CalendarClock, filter: 'schedule' };
    case 'LINEUP':
    case 'GENERAL':
      return { label: 'Announcement', tone: 'announcement', Icon: Megaphone, filter: 'announcements' };
    case 'RULES':
    case 'OTHER':
    default:
      return { label: kind === 'RULES' ? 'Rules' : 'Other', tone: 'neutral', Icon: MessageSquareText, filter: 'other' };
  }
}

function matchesFilter(kind: EventUpdateKind, filter: UpdateFilter): boolean {
  if (filter === 'all') return true;
  return kindMeta(kind).filter === filter;
}

export function EventUpdatesView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventUpdatesScreen slug={slug} eventId={eventId} />
    </OrganizeGate>
  );
}

function EventUpdatesScreen({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const invalidate = useInvalidateOrganize();
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<EventUpdateDto | null>(null);
  const [filter, setFilter] = useState<UpdateFilter>('all');

  const orgQuery = useOrganizerBySlugQuery(slug);
  const org = orgQuery.data ?? null;
  const eventQuery = useOrganizerEventQuery(org?.id, eventId, Boolean(org?.id));
  const event = eventQuery.data ?? null;
  const updatesQuery = useEventUpdatesQuery(org?.id, eventId, Boolean(org?.id));
  const items = updatesQuery.data ?? [];
  const error = orgQuery.error ?? eventQuery.error ?? updatesQuery.error;
  const loading =
    (orgQuery.isPending && !org) ||
    (Boolean(org) && eventQuery.isPending && !event) ||
    (Boolean(org) && updatesQuery.isPending && !updatesQuery.data);

  const counts = useMemo(() => {
    const base = { all: items.length, announcements: 0, schedule: 0, media: 0, other: 0 };
    for (const item of items) {
      const f = kindMeta(item.kind).filter;
      base[f] += 1;
    }
    return base;
  }, [items]);

  const filtered = useMemo(
    () => items.filter((item) => matchesFilter(item.kind, filter)),
    [filter, items],
  );

  async function remove(id: string) {
    if (!org) return;
    if (!window.confirm('Delete this update?')) return;
    const tid = toastPending(toastCopy.saving);
    try {
      await auth.api.deleteEventUpdate(org.id, eventId, id);
      invalidate.invalidateEventUpdates(eventId);
      toastResolve(tid, 'Update deleted');
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, friendlyError(err));
    }
  }

  if (loading && !event) {
    return (
      <OrganizerManageShell>
        <OrganizerWorkspace width="canvas" className="relative z-10 space-y-6">
          <div className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
          <OrganizerSkeletonRows count={4} />
        </OrganizerWorkspace>
      </OrganizerManageShell>
    );
  }

  if (error && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load updates"
          error={error}
          onRetry={() => {
            void orgQuery.refetch();
            void eventQuery.refetch();
            void updatesQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (!org || !event) return null;

  return (
    <OrganizerManageShell>
      <OrganizerWorkspace width="canvas" className="relative z-10 space-y-5 sm:space-y-6">
        <OrganizerEventSubHeader
          org={org}
          event={event}
          sectionLabel="Updates"
          onEditEvent={() => setEditEventOpen(true)}
          trailing={
            <Button
              type="button"
              size="sm"
              className="h-10 gap-1.5 rounded-lg px-3.5 text-[12px] font-bold tracking-[0.08em]"
              onClick={() => {
                setEditing(null);
                setComposerOpen(true);
              }}
            >
              <Plus className="size-3.5" strokeWidth={1.75} aria-hidden />
              New update
            </Button>
          }
        />

        <EditEventDrawer
          open={editEventOpen}
          onOpenChange={setEditEventOpen}
          organizerId={org.id}
          orgSlug={org.slug}
          event={event}
          onUpdated={(next) => invalidate.setEventCache(next)}
        />

        <UpdateComposerSheet
          open={composerOpen}
          onOpenChange={setComposerOpen}
          organizerId={org.id}
          eventId={event.id}
          initial={editing}
          onSaved={() => {
            setComposerOpen(false);
            setEditing(null);
            invalidate.invalidateEventUpdates(event.id);
          }}
        />

        <motion.div
          initial={{ opacity: 0.88 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
          className="space-y-4 sm:space-y-5"
        >
        <OrganizerTabs
          ariaLabel="Update categories"
          items={[
            { id: 'all' as const, label: 'All', count: counts.all },
            { id: 'announcements' as const, label: 'Announcements', count: counts.announcements },
            { id: 'schedule' as const, label: 'Schedule', count: counts.schedule },
            { id: 'media' as const, label: 'Media', count: counts.media },
            { id: 'other' as const, label: 'Other', count: counts.other },
          ]}
          value={filter}
          onChange={setFilter}
        />

        {filtered.length === 0 ? (
          <OrganizerEmptyBlock
            title="No updates yet"
            body="Share schedule changes, announcements or event news here."
          >
            <Button
              type="button"
              className="rounded-lg"
              onClick={() => {
                setEditing(null);
                setComposerOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-3.5" strokeWidth={1.75} aria-hidden />
              New update
            </Button>
          </OrganizerEmptyBlock>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item) => {
              const meta = kindMeta(item.kind);
              const Icon = meta.Icon;
              const detailHref = routes.organizeEventUpdate(org.slug, event.id, item.id);
              return (
                <li key={item.id}>
                  <article className="flex gap-3 rounded-xl border border-white/[0.08] bg-[#141514] p-3 transition-[border-color] duration-150 hover:border-white/[0.14] sm:min-h-[5.75rem] sm:gap-4 sm:p-3.5">
                    <Link
                      href={detailHref}
                      className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#111211] sm:h-[5.25rem] sm:w-[5.25rem]"
                    >
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Icon className="size-5 text-white/35" strokeWidth={1.75} />
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <OrganizerPill tone={meta.tone}>{meta.label}</OrganizerPill>
                      <Link href={detailHref} className="block space-y-1">
                        <h2 className="truncate text-[15px] font-semibold text-[#F4F4F1]">
                          {item.title?.trim() || 'Update'}
                        </h2>
                        <p className="line-clamp-2 text-[13px] leading-snug text-white/55">
                          {item.body}
                        </p>
                        <p className="text-[12px] text-white/35">
                          {relativeUpdateTime(item.publishedAt)}
                        </p>
                      </Link>
                    </div>

                    <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-md border-white/12 px-3 text-[11px] font-semibold"
                        onClick={() => {
                          setEditing(item);
                          setComposerOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
                        Edit
                      </Button>
                      <Dropdown>
                        <DropdownTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="More actions"
                            className="size-8 text-white/45"
                          >
                            <MoreHorizontal className="size-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownContent align="end">
                          <DropdownItem onSelect={() => void remove(item.id)}>Delete</DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    </div>

                    <div className="flex shrink-0 flex-col sm:hidden">
                      <Dropdown>
                        <DropdownTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="More actions"
                            className="size-9 text-white/45"
                          >
                            <MoreHorizontal className="size-4" strokeWidth={1.75} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownContent align="end">
                          <DropdownItem
                            onSelect={() => {
                              setEditing(item);
                              setComposerOpen(true);
                            }}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem onSelect={() => void remove(item.id)}>Delete</DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
        </motion.div>
      </OrganizerWorkspace>

      <button
        type="button"
        aria-label="New update"
        onClick={() => {
          setEditing(null);
          setComposerOpen(true);
        }}
        className="fixed bottom-20 right-4 z-30 inline-flex size-12 items-center justify-center rounded-full bg-accent text-[#0a0a0a] shadow-lg sm:hidden"
      >
        <Plus className="size-5" strokeWidth={2} />
      </button>
    </OrganizerManageShell>
  );
}

export function EventUpdateDetailView({
  slug,
  eventId,
  updateId,
}: {
  slug: string;
  eventId: string;
  updateId: string;
}) {
  return (
    <OrganizeGate>
      <EventUpdateDetailScreen slug={slug} eventId={eventId} updateId={updateId} />
    </OrganizeGate>
  );
}

function EventUpdateDetailScreen({
  slug,
  eventId,
  updateId,
}: {
  slug: string;
  eventId: string;
  updateId: string;
}) {
  const auth = useAuth();
  const router = useRouter();
  const invalidate = useInvalidateOrganize();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);

  const orgQuery = useOrganizerBySlugQuery(slug);
  const org = orgQuery.data ?? null;
  const eventQuery = useOrganizerEventQuery(org?.id, eventId, Boolean(org?.id));
  const event = eventQuery.data ?? null;
  const updatesQuery = useEventUpdatesQuery(org?.id, eventId, Boolean(org?.id));
  const item = updatesQuery.data?.find((u) => u.id === updateId) ?? null;
  const error = orgQuery.error ?? eventQuery.error ?? updatesQuery.error;
  const loading =
    (orgQuery.isPending && !org) ||
    (Boolean(org) && eventQuery.isPending && !event) ||
    (Boolean(org) && updatesQuery.isPending && !updatesQuery.data);

  async function remove() {
    if (!org || !item) return;
    if (!window.confirm('Delete this update?')) return;
    const tid = toastPending(toastCopy.saving);
    try {
      await auth.api.deleteEventUpdate(org.id, eventId, item.id);
      invalidate.invalidateEventUpdates(eventId);
      toastResolve(tid, 'Update deleted');
      router.push(routes.organizeEventUpdates(org.slug, eventId));
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, friendlyError(err));
    }
  }

  if (loading && !event) {
    return (
      <OrganizerWorkspace width="canvas">
        <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
      </OrganizerWorkspace>
    );
  }

  if (error && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError title="Couldn’t load update" error={error} />
      </div>
    );
  }

  if (!org || !event) return null;

  if (updatesQuery.isPending && !updatesQuery.data) {
    return (
      <OrganizerWorkspace width="canvas">
        <div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
      </OrganizerWorkspace>
    );
  }

  const listHref = routes.organizeEventUpdates(org.slug, event.id);
  const publicHref = `${routes.events}/${event.slug}`;
  const manageHref = `${routes.organize}/${org.slug}/events/${event.id}`;
  const isLive = event.status === 'published';
  const place = [event.venue, event.city].filter(Boolean).join(', ');
  const when = formatEventHomeWhen(event.startTime);

  if (!item) {
    return (
      <OrganizerWorkspace width="canvas" className="space-y-4">
        <Link href={listHref} className="inline-flex items-center gap-1.5 text-[13px] text-white/55 hover:text-accent">
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Back to updates
        </Link>
        <OrganizerEmptyBlock title="Update not found" body="It may have been deleted.">
          <Button asChild variant="outline" className="rounded-lg border-white/15">
            <Link href={listHref}>Back to updates</Link>
          </Button>
        </OrganizerEmptyBlock>
      </OrganizerWorkspace>
    );
  }

  const meta = kindMeta(item.kind);
  const Icon = meta.Icon;

  return (
    <div className="min-h-[70vh] bg-[#080908]">
      <OrganizerWorkspace width="canvas" className="space-y-5 sm:space-y-6">
        <Link
          href={listHref}
          className="inline-flex items-center gap-1.5 text-[13px] text-white/55 transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Back to updates
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
          <article className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <OrganizerPill tone={meta.tone}>{meta.label}</OrganizerPill>
              <h1 className="display-title text-[1.75rem] leading-[0.95] tracking-[0.03em] text-[#F4F4F1] sm:text-[2.25rem]">
                {item.title?.trim() || 'Update'}
              </h1>
              <p className="text-[13px] text-white/42">{relativeUpdateTime(item.publishedAt)}</p>
            </div>

            {item.posterUrl ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111211]">
                <img
                  src={item.posterUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              </div>
            ) : null}

            <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-white/75 sm:text-[15px]">
              {item.body}
            </div>
          </article>

          <aside className="space-y-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#141514] p-3.5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/42">
                  Related event
                </p>
                <OrganizerPill tone={isLive ? 'live' : 'neutral'}>
                  {isLive ? 'Live' : statusLabel(event.status)}
                </OrganizerPill>
              </div>
              <div className="flex gap-3">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-white/[0.08] bg-[#111211]">
                  {event.posterUrl ? (
                    <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Icon className="size-4 text-white/30" strokeWidth={1.75} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-display text-[15px] uppercase tracking-[0.04em] text-[#F4F4F1]">
                    {event.title}
                  </p>
                  {when ? <p className="truncate text-[12px] text-white/45">{when}</p> : null}
                  {place ? <p className="truncate text-[12px] text-white/45">{place}</p> : null}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {isLive ? (
                  <Button asChild size="sm" variant="outline" className="h-9 flex-1 rounded-md border-white/12 text-[12px]">
                    <Link href={publicHref} target="_blank" rel="noreferrer">
                      View event
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline" className="h-9 flex-1 rounded-md border-white/12 text-[12px]">
                    <Link href={manageHref}>Event home</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#141514] p-3.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/42">
                Actions
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setComposerOpen(true)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2.5 text-left text-[13px] text-[#F4F4F1] transition-colors hover:bg-white/[0.04]"
                >
                  <Pencil className="size-3.5 text-white/45" strokeWidth={1.75} />
                  Edit update
                </button>
                <button
                  type="button"
                  onClick={() => void remove()}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2.5 text-left text-[13px] text-error transition-colors hover:bg-error/10"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                  Delete update
                </button>
              </div>
            </div>
          </aside>
        </div>

        <UpdateComposerSheet
          open={composerOpen}
          onOpenChange={setComposerOpen}
          organizerId={org.id}
          eventId={event.id}
          initial={item}
          onSaved={() => {
            setComposerOpen(false);
            invalidate.invalidateEventUpdates(event.id);
          }}
        />
        <EditEventDrawer
          open={editEventOpen}
          onOpenChange={setEditEventOpen}
          organizerId={org.id}
          orgSlug={org.slug}
          event={event}
          onUpdated={(next) => invalidate.setEventCache(next)}
        />
      </OrganizerWorkspace>
    </div>
  );
}

const KIND_OPTIONS: Array<{ id: EventUpdateKind; label: string }> = [
  { id: 'GENERAL', label: 'Announcement' },
  { id: 'SCHEDULE', label: 'Schedule' },
  { id: 'MEDIA', label: 'Media' },
  { id: 'LINEUP', label: 'Lineup' },
  { id: 'RULES', label: 'Rules' },
  { id: 'OTHER', label: 'Other' },
];

function UpdateComposerSheet({
  open,
  onOpenChange,
  organizerId,
  eventId,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizerId: string;
  eventId: string;
  initial: EventUpdateDto | null;
  onSaved: (item: EventUpdateDto) => void;
}) {
  const { api } = useAuth();
  const [kind, setKind] = useState<EventUpdateKind>('GENERAL');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(initial?.kind ?? 'GENERAL');
    setTitle(initial?.title ?? '');
    setBody(initial?.body ?? '');
    setPosterUrl(initial?.posterUrl ?? '');
  }, [initial, open]);

  async function save() {
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      if (!body.trim()) throw new Error('Write something for the feed');
      const payload = {
        kind,
        title: title.trim() || null,
        body: body.trim(),
        posterUrl: posterUrl.trim() || null,
      };
      const next = initial
        ? await api.updateEventUpdate(organizerId, eventId, initial.id, payload)
        : await api.createEventUpdate(organizerId, eventId, payload);
      toastResolve(tid, initial ? 'Update saved' : 'Update posted');
      onSaved(next);
      onOpenChange(false);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/[0.09] bg-[#111211] sm:max-w-[560px]"
      >
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="font-display text-2xl uppercase tracking-[0.04em]">
            {initial ? 'Edit update' : 'New update'}
          </SheetTitle>
          <SheetDescription className="text-white/55">
            News for dancers attached to this event.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <label className="block space-y-1.5 text-[13px]">
            <span className="font-semibold text-[#F4F4F1]">Type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as EventUpdateKind)}
              disabled={pending}
              className="flex h-11 w-full rounded-lg border border-white/[0.09] bg-[#161716] px-3 text-[13px] text-[#F4F4F1]"
            >
              {KIND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 text-[13px]">
            <span className="font-semibold text-[#F4F4F1]">Title</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Judges announced"
              disabled={pending}
              className="h-11 border-white/[0.09] bg-[#161716]"
            />
          </label>
          <label className="block space-y-1.5 text-[13px]">
            <span className="font-semibold text-[#F4F4F1]">Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              disabled={pending}
              placeholder="What’s new for the night?"
              className="flex w-full resize-none rounded-lg border border-white/[0.09] bg-[#161716] px-3 py-2.5 text-[13px] text-[#F4F4F1]"
            />
          </label>
          <PosterField
            value={posterUrl}
            onChange={setPosterUrl}
            disabled={pending}
            compact
            label="Media (optional)"
            hint="JPEG, PNG, WebP or GIF · max 5MB"
          />
        </div>

        <div className="mt-8 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={() => void save()} className="flex-1">
            {pending ? 'Saving…' : initial ? 'Save changes' : 'Post update'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Past updates only — compose lives in PostUpdateDialog / UpdateComposerSheet. */
export function EventUpdatesPanel({
  organizerId,
  eventId,
}: {
  organizerId: string;
  eventId: string;
  refreshKey?: number;
}) {
  const updatesQuery = useEventUpdatesQuery(organizerId, eventId, Boolean(organizerId));
  const items = updatesQuery.data ?? [];

  if (updatesQuery.isPending && !updatesQuery.data) {
    return <p className="text-sm text-text-secondary">Loading updates…</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">No updates yet.</p>;
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <li key={item.id} className="space-y-1 py-3">
          <p className="font-semibold text-text-primary">{item.title?.trim() || 'Update'}</p>
          <p className="line-clamp-2 text-sm text-text-secondary">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function PostUpdateDialog({
  organizerId,
  eventId,
  open,
  onOpenChange,
  onPosted,
}: {
  organizerId: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPosted?: () => void;
}) {
  return (
    <UpdateComposerSheet
      open={open}
      onOpenChange={onOpenChange}
      organizerId={organizerId}
      eventId={eventId}
      initial={null}
      onSaved={() => onPosted?.()}
    />
  );
}

export function EventUpdatesPanelBySlug({
  slug,
  eventId,
}: {
  slug: string;
  eventId: string;
}) {
  const orgQuery = useOrganizerBySlugQuery(slug);
  const org = orgQuery.data;
  if (orgQuery.isPending && !org) {
    return <div className="p-4 text-sm text-text-muted">Loading updates…</div>;
  }
  if (!org) return <div className="p-4 text-sm text-text-muted">Organizer not found.</div>;
  return <EventUpdatesPanel organizerId={org.id} eventId={eventId} />;
}
