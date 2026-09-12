'use client';

import type { EventType, OrganizerEventDetailDto } from '@cypher/contracts';
import { assertEndAfterStart, assertRegistrationWindow } from '@cypher/validation';
import { useEffect, useRef, useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
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
import { EventMediaLinksEditor } from '@/features/organize/EventMediaLinksEditor';
import { eventTypeDisplayLabel } from '@/features/organize/event-type-copy';
import { StyleChipsField } from '@/features/organize/StyleChipsField';
import { VenueMapField, type VenueCoords } from '@/features/organize/VenueMapField';
import { cn } from '@/lib/utils';

type TabId = 'basics' | 'details' | 'media';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'basics', label: 'Basics' },
  { id: 'details', label: 'Details' },
  { id: 'media', label: 'Media' },
];

const DESC_MAX = 500;

function toIsoFromLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date/time');
  return date.toISOString();
}

function toLocalParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function combineLocal(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time || '18:00'}`;
}

export function EditEventDrawer({
  open,
  onOpenChange,
  organizerId,
  orgSlug,
  event,
  onUpdated,
  initialTab = 'basics',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizerId: string;
  orgSlug: string;
  event: OrganizerEventDetailDto;
  onUpdated: (next: OrganizerEventDetailDto) => void;
  initialTab?: TabId;
}) {
  void orgSlug;
  const auth = useAuth();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [coords, setCoords] = useState<VenueCoords | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [regOpensAt, setRegOpensAt] = useState('');
  const [regClosesAt, setRegClosesAt] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setTitle(event.title === 'Untitled night' ? '' : event.title);
    setCity(event.city === 'TBD' ? '' : event.city);
    setVenue(event.venue ?? '');
    setCoords(
      event.venueLatitude != null && event.venueLongitude != null
        ? { lat: event.venueLatitude, lng: event.venueLongitude }
        : null,
    );
    const start = toLocalParts(event.startTime);
    setDate(start.date);
    setTime(start.time);
    setEndTime(toLocalParts(event.endTime).date ? `${toLocalParts(event.endTime).date}T${toLocalParts(event.endTime).time}` : '');
    setRegOpensAt(
      event.registrationOpensAt
        ? `${toLocalParts(event.registrationOpensAt).date}T${toLocalParts(event.registrationOpensAt).time}`
        : '',
    );
    setRegClosesAt(
      event.registrationClosesAt
        ? `${toLocalParts(event.registrationClosesAt).date}T${toLocalParts(event.registrationClosesAt).time}`
        : '',
    );
    setDescription(event.description ?? '');
    setPosterUrl(event.posterUrl ?? '');
    setStyles(event.styles ?? []);
  }, [event, initialTab, open]);

  async function save() {
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      if (!title.trim()) throw new Error('Add an event name');
      if (!city.trim()) throw new Error('Add a city');
      if (!date) throw new Error('Pick a date');
      const startIso = toIsoFromLocal(combineLocal(date, time));
      const endIso = endTime ? toIsoFromLocal(endTime) : null;
      const opensIso = regOpensAt ? toIsoFromLocal(regOpensAt) : null;
      const closesIso = regClosesAt ? toIsoFromLocal(regClosesAt) : null;
      assertEndAfterStart(startIso, endIso);
      assertRegistrationWindow({
        opensAt: opensIso,
        closesAt: closesIso,
        startTime: startIso,
      });

      const updated = await auth.api.updateOrganizerEvent(organizerId, event.id, {
        title: title.trim(),
        city: city.trim(),
        venue: venue || null,
        venueLatitude: coords?.lat ?? null,
        venueLongitude: coords?.lng ?? null,
        eventType: event.eventType as EventType,
        startTime: startIso,
        endTime: endIso,
        registrationOpensAt: opensIso,
        registrationClosesAt: closesIso,
        description: description.trim() ? description.trim().slice(0, DESC_MAX) : null,
        posterUrl: posterUrl.trim() || null,
        styles: styles.length > 0 ? styles : [],
      });
      onUpdated(updated);
      toastResolve(tid, toastCopy.basicsSaved);
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
        className="flex w-full max-w-none flex-col border-l border-[#2a2a2a] bg-[#121212] p-0 sm:max-w-[min(100%,36rem)]"
      >
        <SheetHeader className="space-y-1 border-b border-[#2a2a2a] px-5 pb-4 pt-5 pr-12 text-left">
          <SheetTitle className="font-display text-2xl tracking-[0.06em] text-text-primary">
            Edit Event
          </SheetTitle>
          <SheetDescription className="text-sm text-text-secondary">
            Update your event details. Changes reflect on your public page.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1">
          <nav
            aria-label="Edit sections"
            className="hidden w-[5.5rem] shrink-0 flex-col gap-1 border-r border-[#2a2a2a] py-4 sm:flex"
          >
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'relative px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] transition-colors',
                    active ? 'text-accent' : 'text-text-muted hover:text-text-secondary',
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-accent" />
                  ) : null}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex gap-1 border-b border-[#2a2a2a] px-3 py-2 sm:hidden">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold uppercase tracking-[0.1em]',
                    tab === item.id
                      ? 'bg-accent/15 text-accent'
                      : 'text-text-muted',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {tab === 'basics' ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-text-secondary">Event Poster</p>
                    <div className="flex items-start gap-4">
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a]">
                        {posterUrl ? (
                          <img src={posterUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ByndIcon name="poster" className="size-6 text-text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-2 pt-1">
                        <DrawerPosterActions
                          value={posterUrl}
                          onChange={setPosterUrl}
                          disabled={pending}
                        />
                        <p className="text-[11px] text-text-muted">
                          Recommended 1080×1080. JPEG or PNG.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    Event name <span className="text-accent">*</span>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a]"
                      required
                    />
                  </label>

                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    Event type
                    <Input
                      value={eventTypeDisplayLabel(event.eventType)}
                      disabled
                      className="h-11 rounded-xl border-[#2a2a2a] bg-[#161616] text-text-muted"
                    />
                    <span className="block text-[11px] font-normal text-text-muted">
                      Event type cannot be changed after creation.
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                      Date
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a]"
                        required
                      />
                    </label>
                    <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                      Time
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a]"
                        required
                      />
                    </label>
                  </div>

                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    City
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a]"
                      required
                    />
                  </label>

                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    Venue / Location
                    <div className="relative">
                      <ByndIcon
                        name="pin"
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                      />
                      <Input
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a] pl-9"
                        placeholder="Venue name"
                      />
                    </div>
                  </label>

                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    Short description
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                      rows={4}
                      className="flex w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2.5 font-body text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                    <span className="block text-right text-[11px] font-normal text-text-muted">
                      {String(description.length)} / {String(DESC_MAX)}
                    </span>
                  </label>
                </div>
              ) : null}

              {tab === 'details' ? (
                <div className="space-y-5">
                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    End
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a]"
                    />
                    <span className="block text-[11px] font-normal text-text-muted">
                      Optional — multi-day events
                    </span>
                  </label>
                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    Registration opens
                    <Input
                      type="datetime-local"
                      value={regOpensAt}
                      onChange={(e) => setRegOpensAt(e.target.value)}
                      className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a]"
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-semibold text-text-secondary">
                    Registration closes
                    <Input
                      type="datetime-local"
                      value={regClosesAt}
                      onChange={(e) => setRegClosesAt(e.target.value)}
                      className="h-11 rounded-xl border-[#2a2a2a] bg-[#1a1a1a]"
                    />
                  </label>
                  <VenueMapField
                    venueName={venue}
                    onVenueNameChange={setVenue}
                    coords={coords}
                    onCoordsChange={setCoords}
                    disabled={pending}
                  />
                  <div className="space-y-2 text-sm font-semibold text-text-secondary">
                    <p>
                      Dance styles <span className="font-normal text-text-muted">(optional)</span>
                    </p>
                    <StyleChipsField value={styles} onChange={setStyles} disabled={pending} />
                  </div>
                </div>
              ) : null}

              {tab === 'media' ? (
                <EventMediaLinksEditor
                  organizerId={organizerId}
                  eventId={event.id}
                  links={event.mediaLinks ?? []}
                  categories={(event.categories ?? [])
                    .filter((c) => c.entryType !== 'viewer')
                    .map((c) => ({ id: c.id, name: c.name }))}
                  onUpdated={onUpdated}
                />
              ) : null}
            </div>

            {tab !== 'media' ? (
              <div className="flex gap-2 border-t border-[#2a2a2a] px-5 py-4">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => void save()}
                  className="h-11 flex-1 rounded-xl text-xs tracking-[0.12em]"
                >
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => onOpenChange(false)}
                  className="h-11 rounded-xl border-[#2a2a2a] px-5 text-xs tracking-[0.12em]"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex justify-end border-t border-[#2a2a2a] px-5 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-11 rounded-xl border-[#2a2a2a] px-5 text-xs tracking-[0.12em]"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerPosterActions({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const auth = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const tid = toastPending(toastCopy.uploading);
    try {
      const uploaded = await auth.api.uploadPoster(file, file.name);
      onChange(uploaded.url);
      toastResolve(tid, toastCopy.posterUploaded);
    } catch (err) {
      toastReject(tid, toastCopy.uploadFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border-[#2a2a2a]"
      >
        {uploading ? 'Uploading…' : value ? 'Change poster' : 'Add poster'}
      </Button>
      {value ? (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => onChange('')}
          className="text-sm font-medium text-error hover:underline disabled:opacity-50"
        >
          Remove
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}
