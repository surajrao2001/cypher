'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto } from '@cypher/contracts';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { PosterField } from '@/features/organize/PosterField';

const EVENT_TYPES = ['battle', 'jam', 'workshop', 'showcase'] as const;

type CategoryDraft = {
  key: string;
  name: string;
  capacity: string;
  priceRupees: string;
  teamSize: string;
};

function newCategory(partial?: Partial<CategoryDraft>): CategoryDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    capacity: '32',
    priceRupees: '0',
    teamSize: '1',
    ...partial,
  };
}

function toIsoFromLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date/time');
  }
  return date.toISOString();
}

export function CreateEventForm({ slug }: { slug: string }) {
  return (
    <OrganizeGate>
      <CreateEventFormInner slug={slug} />
    </OrganizeGate>
  );
}

function CreateEventFormInner({ slug }: { slug: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]>('battle');
  const [startTime, setStartTime] = useState('');
  const [description, setDescription] = useState('');
  const [styles, setStyles] = useState('Breaking');
  const [posterUrl, setPosterUrl] = useState('');
  const [categories, setCategories] = useState<CategoryDraft[]>([
    newCategory({ name: '1v1', teamSize: '1' }),
    newCategory({ name: '2v2', capacity: '16', teamSize: '2' }),
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void auth.api
      .getMyOrganizerBySlug(slug)
      .then((item) => {
        if (!cancelled) {
          setOrg(item);
          if (item.city) setCity(item.city);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Organizer not found');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.api, slug]);

  function updateCategory(key: string, patch: Partial<CategoryDraft>) {
    setCategories((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!org) return;
    setPending(true);
    setError(null);
    try {
      const cleaned = categories
        .map((row) => ({
          name: row.name.trim(),
          capacity: Number(row.capacity),
          priceMinor: Math.round(Number(row.priceRupees || 0) * 100),
          teamSize: Number(row.teamSize || 1),
        }))
        .filter((row) => row.name.length > 0 && row.capacity > 0);
      if (cleaned.length === 0) {
        throw new Error('Add at least one registration category');
      }
      const created = await auth.api.createOrganizerEvent(org.id, {
        title,
        city,
        venue: venue || undefined,
        eventType,
        startTime: toIsoFromLocal(startTime),
        description: description || undefined,
        posterUrl: posterUrl.trim() || undefined,
        styles: styles
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        categories: cleaned,
      });
      router.push(`${routes.organize}/${org.slug}/events/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create event');
    } finally {
      setPending(false);
    }
  }

  if (error && !org) {
    return <p className="px-6 py-16 text-sm text-error">{error}</p>;
  }

  if (!org) {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <p className="kicker text-accent">{org.orgName}</p>
        <h1 className="display-title text-5xl">Draft event</h1>
        <p className="text-sm text-text-secondary">
          Each category is a registration lane dancers pick (e.g. 1v1 vs 2v2). Poster shows on Discover.
        </p>
      </div>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="block space-y-2 text-sm text-text-secondary">
          Event title
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
            placeholder="Andheri Cypher Night"
          />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          City
          <Input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Mumbai" />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Venue name
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Studio name or address" />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Event type
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as (typeof EVENT_TYPES)[number])}
            className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 font-body text-sm text-text-primary"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Start date & time
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Dance styles (comma-separated)
          <Input
            value={styles}
            onChange={(e) => setStyles(e.target.value)}
            placeholder="Breaking, Hip Hop"
          />
        </label>

        <PosterField value={posterUrl} onChange={setPosterUrl} disabled={pending} />

        <label className="block space-y-2 text-sm text-text-secondary">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What dancers should know before they register"
            className="flex w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </label>

        <fieldset className="space-y-4 border border-border p-4">
          <legend className="px-1 text-xs uppercase tracking-[0.16em] text-text-muted">
            Registration categories
          </legend>
          <p className="text-xs text-text-muted">
            These are the options on the register screen — name, how many entries you allow, fee, and
            how many dancers count as one entry.
          </p>
          {categories.map((row, index) => (
            <div key={row.key} className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                  Category {index + 1}
                </p>
                {categories.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategories((rows) => rows.filter((item) => item.key !== row.key))}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <label className="block space-y-2 text-sm text-text-secondary">
                Category name
                <Input
                  value={row.name}
                  onChange={(e) => updateCategory(row.key, { name: e.target.value })}
                  required
                  placeholder="e.g. 1v1, 2v2, Open"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block space-y-2 text-sm text-text-secondary">
                  Max spots
                  <Input
                    type="number"
                    min={1}
                    value={row.capacity}
                    onChange={(e) => updateCategory(row.key, { capacity: e.target.value })}
                    required
                    placeholder="How many entries"
                  />
                  <span className="block text-[11px] text-text-muted">Total entries allowed</span>
                </label>
                <label className="block space-y-2 text-sm text-text-secondary">
                  Entry fee (₹)
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={row.priceRupees}
                    onChange={(e) => updateCategory(row.key, { priceRupees: e.target.value })}
                    placeholder="0 for free"
                  />
                  <span className="block text-[11px] text-text-muted">Per entry · 0 = free</span>
                </label>
                <label className="block space-y-2 text-sm text-text-secondary">
                  Dancers per entry
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={row.teamSize}
                    onChange={(e) => updateCategory(row.key, { teamSize: e.target.value })}
                    placeholder="1 for 1v1"
                  />
                  <span className="block text-[11px] text-text-muted">1 = solo · 2 = duo</span>
                </label>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setCategories((rows) => [...rows, newCategory()])}
          >
            Add another category
          </Button>
        </fieldset>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending} size="lg">
            {pending ? 'Saving…' : 'Save draft'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push(`${routes.organize}/${org.slug}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
