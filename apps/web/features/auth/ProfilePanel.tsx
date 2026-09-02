'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/features/shell/EmptyState';
import { useAuth } from '@/features/auth/AuthProvider';

export function ProfilePanel() {
  const auth = useAuth();
  const [dancerName, setDancerName] = useState('');
  const [city, setCity] = useState('');
  const [crew, setCrew] = useState('');
  const [styles, setStyles] = useState('');
  const [instagram, setInstagram] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!auth.ready) {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading session…</p>;
  }

  if (!auth.token || !auth.me) {
    return (
      <EmptyState
        kicker="Profile"
        title="Sign in with your phone"
        body="OTP lands on this number. After verify, we create your dancer row if it does not exist yet."
      >
        <Button asChild size="lg">
          <Link href={routes.login}>Enter with OTP</Link>
        </Button>
      </EmptyState>
    );
  }

  async function saveOnboarding() {
    setPending(true);
    setMessage(null);
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save profile.');
    } finally {
      setPending(false);
    }
  }

  if (auth.me.needsOnboarding) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2">
          <p className="kicker text-accent">Onboarding</p>
          <h1 className="display-title text-5xl">Name the dancer</h1>
          <p className="text-sm text-text-secondary">City and dancer name are enough to get on the floor.</p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveOnboarding();
          }}
        >
          <label className="block space-y-2 text-sm text-text-secondary">
            Dancer name
            <Input value={dancerName} onChange={(event) => setDancerName(event.target.value)} required minLength={2} />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            City
            <Input value={city} onChange={(event) => setCity(event.target.value)} required minLength={2} />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            Crew (optional)
            <Input value={crew} onChange={(event) => setCrew(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            Styles (comma separated)
            <Input value={styles} onChange={(event) => setStyles(event.target.value)} placeholder="Breaking, Hip-hop" />
          </label>
          <label className="block space-y-2 text-sm text-text-secondary">
            Instagram (optional)
            <Input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@handle" />
          </label>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
        {message ? <p className="text-sm text-error">{message}</p> : null}
      </div>
    );
  }

  const profile = auth.me.profile;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="kicker text-accent">Profile</p>
        <h1 className="display-title text-5xl">{profile.dancerName ?? profile.name}</h1>
        <p className="text-text-secondary">{profile.city ?? 'City not set'}</p>
      </div>
      <dl className="grid gap-4 rounded-lg border border-border bg-surface p-6 text-sm md:grid-cols-2">
        <div>
          <dt className="text-text-muted">Crew</dt>
          <dd>{profile.crew ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Styles</dt>
          <dd>{profile.styles.length ? profile.styles.join(', ') : '—'}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Instagram</dt>
          <dd>{profile.instagram ? `@${profile.instagram}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Organizer desks</dt>
          <dd>{auth.me.organizerMemberships.length || 'None yet'}</dd>
        </div>
      </dl>
      <Button variant="outline" onClick={() => auth.signOut()}>
        Sign out
      </Button>
    </div>
  );
}
