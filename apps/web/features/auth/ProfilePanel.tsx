'use client';

import { routes } from '@cypher/contracts';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { safeNextPath } from '@/lib/auth-routes';

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
  const [message, setMessage] = useState<string | null>(null);

  if (auth.status === 'loading') {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading session…</p>;
  }

  if (auth.status !== 'authenticated' || !auth.me) {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading your dancer card…</p>;
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
      const next = safeNextPath(searchParams.get('next'), routes.discover);
      router.replace(next);
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
        {auth.error ? <p className="text-sm text-error">{auth.error}</p> : null}
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
      <Button variant="outline" onClick={() => void auth.signOut()}>
        Sign out
      </Button>
    </div>
  );
}
