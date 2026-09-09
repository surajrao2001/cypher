'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { safeNextPath } from '@/lib/auth-routes';
import { createBrowserSupabase } from '@/lib/supabase/browser';

export function ProfilePanel() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dancerName, setDancerName] = useState('');
  const [city, setCity] = useState('');
  const [crew, setCrew] = useState('');
  const [styles, setStyles] = useState('');
  const [instagram, setInstagram] = useState('');
  const [pending, setPending] = useState(false);
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [orgCount, setOrgCount] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.me || auth.me.needsOnboarding) return;
    const me = auth.me;
    let cancelled = false;
    void (async () => {
      try {
        const [regs, orgs, session] = await Promise.all([
          auth.api.listMyRegistrations().catch(() => null),
          auth.api.listMyOrganizers().catch(() => null),
          createBrowserSupabase()
            .auth.getSession()
            .then((res) => res.data.session)
            .catch(() => null),
        ]);
        if (cancelled) return;
        setTicketCount(regs?.items.length ?? 0);
        setOrgCount(orgs?.length ?? me.organizerMemberships.length);
        setEmail(session?.user.email ?? null);
      } catch {
        if (!cancelled) {
          setTicketCount(null);
          setOrgCount(me.organizerMemberships.length);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.api, auth.me, auth.status]);

  if (auth.status === 'loading') {
    return <div className="min-h-[40vh] bg-bg" aria-busy="true" aria-label="Loading" />;
  }

  if (auth.status === 'unauthenticated') {
    return <div className="min-h-[40vh] bg-bg" aria-busy="true" aria-label="Redirecting" />;
  }

  if (!auth.me) {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading your account…</p>;
  }

  async function saveOnboarding() {
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      await auth.completeOnboarding({
        dancerName,
        city,
        crew: crew || undefined,
        styles: styles
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        instagram: instagram || undefined,
      });
      toastResolve(tid, toastCopy.profileSaved);
      const next = safeNextPath(searchParams.get('next'), routes.discover);
      router.replace(next);
    } catch (error) {
      toastReject(
        tid,
        toastCopy.saveFailed,
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setPending(false);
    }
  }

  if (auth.me.needsOnboarding) {
    return (
      <div className="relative mx-auto max-w-lg space-y-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-10%] top-[-20%] h-48 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,104,0,0.14),transparent_70%)]"
        />
        <div className="relative space-y-4">
          <BrandLogo variant="mark" size="lg" href={null} />
          <p className="kicker text-accent">You’re in · one more thing</p>
          <h1 className="display-title text-5xl">Who’s on the card?</h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            Name + city and you’re on the list. Props for showing up. Crew and styles can wait —
            no pressure.
          </p>
        </div>
        <form
          className="relative space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveOnboarding();
          }}
        >
          <label className="block space-y-2 text-sm text-text-secondary">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-text-primary">What should we call you, cuh?</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent/80">
                needed
              </span>
            </span>
            <span className="block text-xs text-text-muted">
              Floor name, IG name, whatever you reppin’ — shows on tickets and the scene
            </span>
            <Input
              value={dancerName}
              onChange={(event) => setDancerName(event.target.value)}
              required
              minLength={2}
              className="rounded-sm"
              placeholder="e.g. B-Boy Rex, Aisha…"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-text-primary">Where you based?</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent/80">
                needed
              </span>
            </span>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
              minLength={2}
              className="rounded-sm"
              placeholder="Mumbai, Bengaluru…"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-text-primary">Crew</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                optional
              </span>
            </span>
            <Input
              value={crew}
              onChange={(event) => setCrew(event.target.value)}
              className="rounded-sm"
              placeholder="If you ride with one"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-text-primary">Styles</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                optional
              </span>
            </span>
            <span className="block text-xs text-text-muted">Comma-separated for now</span>
            <Input
              value={styles}
              onChange={(event) => setStyles(event.target.value)}
              placeholder="Breaking, Hip Hop…"
              className="rounded-sm"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-text-primary">Instagram</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
                optional
              </span>
            </span>
            <Input
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              placeholder="@handle"
              className="rounded-sm"
            />
          </label>
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-sm text-sm font-semibold uppercase tracking-[0.14em]"
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Let’s go'}
          </Button>
        </form>
      </div>
    );
  }

  const profile = auth.me.profile;
  const displayName = profile.dancerName ?? profile.name ?? 'You';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const stylesLine = profile.styles.length ? profile.styles.join(' · ') : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex items-center gap-5 border-b border-border pb-7">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border bg-elevated font-display text-3xl text-text-secondary">
          {initials || '·'}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">They call you</p>
          <h1 className="display-title text-4xl md:text-5xl">{displayName}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {profile.city ?? 'City not set yet'}
            {profile.crew ? ` · ${profile.crew}` : ''}
            {stylesLine ? ` · ${stylesLine}` : ''}
          </p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-bold text-text-primary">Your card</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-muted">Name on the floor</dt>
                <dd className="mt-1 text-lg font-semibold text-text-primary">
                  {profile.dancerName ?? profile.name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Based in</dt>
                <dd className="mt-1 text-text-primary">{profile.city ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Crew</dt>
                <dd className="mt-1 text-text-primary">{profile.crew ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Styles</dt>
                <dd className="mt-1 text-text-primary">
                  {profile.styles.length ? profile.styles.join(', ') : '—'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-text-muted">Instagram</dt>
                <dd className="mt-1 text-text-primary">
                  {profile.instagram ? `@${profile.instagram}` : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-4 text-sm font-bold text-text-primary">How you signed in</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Email</dt>
                <dd className="mt-1 break-all text-text-primary">{email ?? '—'}</dd>
                <p className="mt-1 text-[11px] text-text-muted">Comes from Google / your login — we don’t edit it here</p>
              </div>
            </dl>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-display text-2xl text-text-primary">
                  {ticketCount === null ? '—' : ticketCount}
                </p>
                <p className="text-xs text-text-muted">Tickets</p>
              </div>
              <div>
                <p className="font-display text-2xl text-text-primary">
                  {orgCount === null ? '—' : orgCount}
                </p>
                <p className="text-xs text-text-muted">Crews you run</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
              <Button asChild variant="outline" size="sm">
                <Link href={routes.tickets}>My tickets</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={routes.organize}>Organize</Link>
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              void (async () => {
                await auth.signOut();
                router.replace(routes.login);
              })();
            }}
          >
            Sign out
          </Button>
        </aside>
      </div>
    </div>
  );
}
