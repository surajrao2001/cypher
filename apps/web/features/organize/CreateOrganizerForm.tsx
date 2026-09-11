'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerType } from '@cypher/contracts';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { ORGANIZER_TYPE_OPTIONS } from '@/features/organize/event-taxonomy';

export function CreateOrganizerForm() {
  return (
    <OrganizeGate>
      <CreateOrganizerFormInner />
    </OrganizeGate>
  );
}

function CreateOrganizerFormInner() {
  const auth = useAuth();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [type, setType] = useState<OrganizerType>('independent');
  const [city, setCity] = useState('');
  const [slug, setSlug] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bio, setBio] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      const org = await auth.api.createOrganizer({
        orgName,
        type,
        city: city || undefined,
        slug: slug || undefined,
        instagram: instagram || undefined,
        bio: bio || undefined,
      });
      toastResolve(tid, toastCopy.organizerCreated);
      router.push(`${routes.organize}/${org.slug}?welcome=1`);
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
      <div className="max-w-2xl space-y-2">
        <p className="kicker text-accent">Organize</p>
        <h1 className="display-title text-4xl md:text-5xl">New organizer profile</h1>
        <p className="text-sm text-text-secondary">
          Name the crew or brand that runs nights. You can create events right after this.
        </p>
      </div>

      <form
        className="rounded-xl border border-border bg-surface p-5 md:p-7"
        onSubmit={(event) => void onSubmit(event)}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2 text-sm text-text-secondary md:col-span-2">
            Organizer name
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              minLength={2}
              placeholder="Mumbai City Breakers"
            />
          </label>

          <label className="block space-y-2 text-sm text-text-secondary">
            Organizer type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OrganizerType)}
              className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 font-body text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {ORGANIZER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="block text-xs text-text-muted">
              {ORGANIZER_TYPE_OPTIONS.find((o) => o.value === type)?.hint}
            </span>
          </label>

          <label className="block space-y-2 text-sm text-text-secondary">
            City
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
          </label>

          <label className="block space-y-2 text-sm text-text-secondary">
            URL slug <span className="text-text-muted">(optional)</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mumbai-city-breakers"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            />
          </label>

          <label className="block space-y-2 text-sm text-text-secondary">
            Instagram <span className="text-text-muted">(optional)</span>
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@crew"
            />
          </label>

          <label className="block space-y-2 text-sm text-text-secondary md:col-span-2">
            Bio <span className="text-text-muted">(optional)</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="flex w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Creating…' : 'Create profile'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push(routes.organize)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
