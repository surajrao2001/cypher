'use client';

import type { OrganizerDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { CREATE_TYPE_OPTIONS } from '@/features/organize/create-type-options';
import { resolveHostOrganizer } from '@/features/organize/ensure-personal-organizer';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
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
      <div className="mx-auto max-w-3xl px-4 py-16">
        <SoftError title="Couldn’t start" error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!host || orgs === null) {
    return <PageLoading variant="form" className="px-6 py-16" label="Loading" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: 'Create' },
        ]}
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
            className="h-9 rounded-md border border-border bg-elevated px-3 text-sm text-text-primary"
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
        <section className="space-y-5">
          <div className="space-y-2">
            <p className="kicker text-accent">Create</p>
            <h1 className="display-title text-4xl md:text-5xl">What&apos;s happening?</h1>
            <p className="text-sm text-text-secondary">
              Pick the shape of the night. You can add entry and details after it exists.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CREATE_TYPE_OPTIONS.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => pickType(option)}
                  className={cn(
                    'flex h-full w-full flex-col items-start gap-2 rounded-xl border border-border bg-surface px-4 py-5 text-left transition-colors',
                    'hover:border-accent/50 hover:bg-elevated/40',
                  )}
                >
                  <span className="font-display text-2xl uppercase tracking-[0.04em] text-text-primary">
                    {option.label}
                  </span>
                  <span className="text-sm text-text-secondary">{option.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="space-y-2">
            <button
              type="button"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted hover:text-accent"
              onClick={() => setStep('type')}
            >
              ← What&apos;s happening?
            </button>
            <h1 className="display-title text-4xl md:text-5xl">New {selected.label}</h1>
            <p className="text-sm text-text-secondary">
              {selected.path === 'battle'
                ? 'Name the battle and when it lands. Add competition entry after you create it.'
                : selected.path === 'workshop'
                  ? 'Name, when, where. Add paid or free entry later if you need it.'
                  : 'Name, when, where. Put it up when you’re ready — entry is optional.'}
            </p>
          </div>

          <form
            className="space-y-4 rounded-xl border border-border bg-surface p-5 md:p-6"
            onSubmit={(e) => void onSubmit(e)}
          >
            <label className="block space-y-2 text-sm text-text-secondary">
              Name
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={2}
                placeholder={
                  selected.eventType === 'battle'
                    ? 'Ground Zero'
                    : selected.eventType === 'workshop'
                      ? 'House Workshop'
                      : 'Sunday Exchange'
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-text-secondary">
                When
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </label>
              <label className="block space-y-2 text-sm text-text-secondary">
                City
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Bengaluru"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm text-text-secondary">
              Where <span className="text-text-muted">(optional)</span>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Cubbon Park / studio name"
              />
            </label>

            <PosterField
              value={posterUrl}
              onChange={setPosterUrl}
              disabled={pending}
              label="Poster"
              hint="Optional — looks better on Discover."
              compact
            />

            {selected.path === 'battle' || selected.path === 'workshop' ? (
              <label className="block space-y-2 text-sm text-text-secondary">
                Description <span className="text-text-muted">(optional)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={5000}
                  className="flex w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  placeholder={
                    selected.path === 'workshop'
                      ? 'What’s the class about? Who’s teaching?'
                      : 'Formats, rules, vibe…'
                  }
                />
              </label>
            ) : null}

            {formError ? <InlineNotice tone="warn">{formError}</InlineNotice> : null}

            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? 'Creating…' : 'Continue'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.push(routes.organize)}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
