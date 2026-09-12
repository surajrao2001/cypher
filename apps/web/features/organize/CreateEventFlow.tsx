'use client';

import type { OrganizerDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { CREATE_TYPE_OPTIONS } from '@/features/organize/create-type-options';
import { resolveHostOrganizer } from '@/features/organize/ensure-personal-organizer';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { PosterField } from '@/features/organize/PosterField';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { PageLoading, SoftError, friendlyError, InlineNotice } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

function toIsoFromLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date/time');
  }
  return date.toISOString();
}

function toLocalInputValue(iso: string): string {
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

const PRIMARY_TYPES = CREATE_TYPE_OPTIONS.filter(
  (o) => o.id === 'battle' || o.id === 'jam-cypher',
);
const SECONDARY_TYPES = CREATE_TYPE_OPTIONS.filter(
  (o) => o.id !== 'battle' && o.id !== 'jam-cypher',
);

export function CreateEventFlow() {
  return (
    <OrganizeGate>
      <Suspense fallback={<PageLoading variant="form" className="px-6 py-16" label="Loading" />}>
        <CreateEventFlowInner />
      </Suspense>
    </OrganizeGate>
  );
}

function CreateEventFlowInner() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostParam = searchParams.get('host');
  const typeParam = searchParams.get('type');

  const [orgs, setOrgs] = useState<OrganizerDto[] | null>(null);
  const [host, setHost] = useState<OrganizerDto | null>(null);
  const [step, setStep] = useState<'type' | 'details'>(typeParam ? 'details' : 'type');
  const [selected, setSelected] = useState<(typeof CREATE_TYPE_OPTIONS)[number] | null>(() => {
    return CREATE_TYPE_OPTIONS.find((o) => o.id === typeParam) ?? null;
  });
  const [error, setError] = useState<unknown>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [startTime, setStartTime] = useState(defaultStartLocal);
  const [posterUrl, setPosterUrl] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await auth.api.listMyOrganizers();
        if (cancelled) return;
        setOrgs(list);
        const resolved = await resolveHostOrganizer(auth.api, auth.me?.profile, hostParam);
        if (cancelled) return;
        setHost(resolved);
        if (!city && resolved.city) setCity(resolved.city);
        else if (!city && auth.me?.profile.city) setCity(auth.me.profile.city);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setBootError(friendlyError(err, 'Could not start create'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.api, auth.me?.profile, hostParam]);

  useEffect(() => {
    if (!typeParam) {
      setSelected(null);
      setStep('type');
      return;
    }
    const match = CREATE_TYPE_OPTIONS.find((o) => o.id === typeParam);
    if (match) {
      setSelected(match);
      setStep('details');
    }
  }, [typeParam]);

  function pickType(option: (typeof CREATE_TYPE_OPTIONS)[number]) {
    setSelected(option);
    setStep('details');
    const params = new URLSearchParams();
    if (host?.slug || hostParam) params.set('host', host?.slug ?? hostParam!);
    params.set('type', option.id);
    router.replace(`${routes.organize}/create?${params.toString()}`, { scroll: false });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!host || !selected) return;
    setPending(true);
    setFormError(null);
    const tid = toastPending(toastCopy.saving);
    try {
      if (!title.trim()) throw new Error('Add a name');
      if (!city.trim()) throw new Error('Add a city');
      if (!startTime) throw new Error('Pick a date and time');
      const startIso = toIsoFromLocal(startTime);

      const created = await auth.api.createOrganizerEvent(host.id, {
        title: title.trim(),
        city: city.trim(),
        venue: venue.trim() || undefined,
        eventType: selected.eventType,
        startTime: startIso,
        posterUrl: posterUrl.trim() || undefined,
        description: description.trim() || undefined,
      });
      toastResolve(tid, 'Saved.');
      router.replace(`${routes.organize}/${host.slug}/events/${created.id}?created=1`);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
      setFormError(friendlyError(err, 'Could not create event'));
    } finally {
      setPending(false);
    }
  }

  if (error && !host) {
    return (
      <OrganizerWorkspace width="form">
        <SoftError title="Couldn’t start" error={error} onRetry={() => window.location.reload()} />
      </OrganizerWorkspace>
    );
  }

  if (!host || orgs === null) {
    return <PageLoading variant="form" className="px-6 py-16" label="Loading" />;
  }

  return (
    <div
      className={cn(
        'relative',
        step === 'type' || !selected
          ? 'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[28rem] before:bg-[radial-gradient(ellipse_at_top_right,rgba(255,104,0,0.28)_0%,rgba(255,104,0,0.08)_35%,transparent_70%)] before:content-[\'\']'
          : undefined,
      )}
    >
    <OrganizerWorkspace
      width="full"
      className="relative z-10"
    >
      <PageBreadcrumb
        tone={step === 'type' || !selected ? 'accent' : 'muted'}
        items={
          selected && step === 'details'
            ? [
                { label: 'Organize', href: routes.organize },
                {
                  label: 'Create',
                  href: host
                    ? `${routes.organize}/create?host=${encodeURIComponent(host.slug)}`
                    : `${routes.organize}/create`,
                },
                { label: `New ${selected.label}` },
              ]
            : [
                { label: 'Organize', href: routes.organize },
                { label: 'Create' },
              ]
        }
      />

      {orgs.length > 1 ? (
        <label className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Hosting as
          </span>
          <select
            value={host.slug}
            onChange={(e) => {
              const next = orgs.find((o) => o.slug === e.target.value);
              if (next) {
                setHost(next);
                const params = new URLSearchParams();
                params.set('host', next.slug);
                if (selected) params.set('type', selected.id);
                router.replace(`${routes.organize}/create?${params.toString()}`, { scroll: false });
              }
            }}
            className="h-9 rounded-xl border border-border/80 bg-elevated px-3 text-sm text-text-primary"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.slug}>
                {org.orgName}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {bootError ? <InlineNotice tone="warn">{bootError}</InlineNotice> : null}

      {step === 'type' || !selected ? (
        <section className="space-y-7">
          <div className="space-y-3">
            <h1 className="display-title text-[2.75rem] leading-[0.9] tracking-[0.04em] sm:text-6xl md:text-7xl">
              What&apos;s happening?
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-text-secondary sm:text-base">
              Pick the shape of the night. You can add entry and details after it exists.
            </p>
          </div>

          <ul className="grid gap-4 md:grid-cols-2">
            {PRIMARY_TYPES.map((option) => (
              <li key={option.id}>
                <TypeCard option={option} size="lg" onPick={() => pickType(option)} />
              </li>
            ))}
          </ul>

          <ul className="grid gap-4 sm:grid-cols-3">
            {SECONDARY_TYPES.map((option) => (
              <li key={option.id}>
                <TypeCard option={option} size="sm" onPick={() => pickType(option)} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="w-full rounded-2xl border border-[#2a2a2a] bg-[#121212]/40 p-5 sm:p-8 md:p-10">
          <div className="mb-8 space-y-3">
            <h1 className="display-title text-[2.5rem] leading-[0.9] tracking-[0.04em] sm:text-5xl md:text-6xl">
              New {selected.label}
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-text-secondary">
              Name, when, where. Put it up when you&apos;re ready — entry is optional.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => void onSubmit(e)}>
            <label className="block space-y-2 text-sm font-medium text-text-primary">
              Name
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                className="h-12 rounded-xl border-[#2a2a2a] bg-[#0f0f0f] text-base"
                placeholder={
                  selected.eventType === 'battle'
                    ? 'Ground Zero'
                    : selected.eventType === 'workshop'
                      ? 'House Workshop'
                      : 'Sunday Exchange'
                }
              />
            </label>

            <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)]">
              <label className="block space-y-2 text-sm font-medium text-text-primary">
                When
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="h-12 rounded-xl border-[#2a2a2a] bg-[#0f0f0f] text-base"
                />
              </label>
              <span
                className="mb-3 hidden text-center text-lg text-text-muted sm:block"
                aria-hidden
              >
                –
              </span>
              <label className="block space-y-2 text-sm font-medium text-text-primary">
                City
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Bengaluru"
                  className="h-12 rounded-xl border-[#2a2a2a] bg-[#0f0f0f] text-base"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-text-primary">
              Where <span className="font-normal text-text-muted">(optional)</span>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Cubbon Park / studio name"
                className="h-12 rounded-xl border-[#2a2a2a] bg-[#0f0f0f] text-base"
              />
            </label>

            <PosterField
              value={posterUrl}
              onChange={setPosterUrl}
              disabled={pending}
              label="Poster"
              hint="A strong poster looks better on Discover. You can add this later."
              createPanel
            />

            {selected.path === 'battle' || selected.path === 'workshop' ? (
              <label className="block space-y-2 text-sm font-medium text-text-primary">
                Description <span className="font-normal text-text-muted">(optional)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={5000}
                  className="flex w-full rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-3 font-body text-base text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  placeholder={
                    selected.path === 'workshop'
                      ? 'What’s the class about? Who’s teaching?'
                      : 'Formats, rules, vibe…'
                  }
                />
              </label>
            ) : null}

            {formError ? <InlineNotice tone="warn">{formError}</InlineNotice> : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="h-12 rounded-lg px-8 text-sm tracking-[0.14em]"
              >
                {pending ? 'Creating…' : 'Continue →'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(routes.organize)}
                className="h-12 rounded-lg border-[#2a2a2a] px-6 text-sm tracking-[0.14em]"
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}
    </OrganizerWorkspace>
    </div>
  );
}

function TypeCard({
  option,
  size,
  onPick,
}: {
  option: (typeof CREATE_TYPE_OPTIONS)[number];
  size: 'lg' | 'sm';
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'group relative flex w-full overflow-hidden rounded-2xl border border-white/10 text-left transition-[border-color,transform] duration-200',
        'hover:border-accent/55 active:scale-[0.99] motion-reduce:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        size === 'lg' ? 'min-h-[14.5rem] sm:min-h-[16.5rem]' : 'min-h-[11.5rem] sm:min-h-[12.5rem]',
      )}
    >
      <img
        src={option.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
      <div
        className={cn(
          'relative z-10 flex h-full w-full flex-col justify-end gap-2',
          size === 'lg' ? 'p-5 sm:p-6' : 'p-4 sm:p-5',
        )}
      >
        <span
          className={cn(
            'font-display uppercase tracking-[0.04em] text-white',
            size === 'lg' ? 'text-3xl sm:text-4xl md:text-[2.65rem]' : 'text-2xl sm:text-3xl',
          )}
        >
          {option.label}
        </span>
        <span
          className={cn(
            'max-w-md text-white/80',
            size === 'lg' ? 'text-sm sm:text-[15px]' : 'text-xs sm:text-sm',
          )}
        >
          {option.hint}
        </span>
        <ByndIcon
          name="chevronRight"
          className="absolute bottom-5 right-5 size-5 text-accent opacity-90 transition-transform group-hover:translate-x-0.5 sm:bottom-6 sm:right-6"
          aria-hidden
        />
      </div>
    </button>
  );
}
