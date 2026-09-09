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
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <p className="kicker text-accent">New crew</p>
        <h1 className="display-title text-5xl">Create organizer</h1>
        <p className="text-sm text-text-secondary">
          Auto-verified for local Phase 1. You become owner immediately.
        </p>
      </div>
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <label className="block space-y-2 text-sm text-text-secondary">
          Organizer name
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required minLength={2} />
        </label>
        <fieldset className="space-y-3">
          <legend className="text-sm text-text-secondary">Organizer type</legend>
          <div className="grid gap-2">
            {ORGANIZER_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface px-3 py-3 has-[:checked]:border-accent/50"
              >
                <input
                  type="radio"
                  name="org-type"
                  className="mt-1"
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                />
                <span>
                  <span className="block text-sm font-semibold text-text-primary">{option.label}</span>
                  <span className="block text-xs text-text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-2 text-sm text-text-secondary">
          City
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Slug (optional)
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="mumbai-city-breakers"
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Instagram
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@crew" />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={3}
            className="flex w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-muted focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </label>
        <div className="flex gap-3">
          <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Creating…' : 'Create'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push(routes.organize)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
