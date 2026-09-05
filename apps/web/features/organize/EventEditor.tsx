'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { EventRegistrationsPanel } from '@/features/organize/EventRegistrationsPanel';
import { EventMediaLinksEditor } from '@/features/organize/EventMediaLinksEditor';
import { PosterField } from '@/features/organize/PosterField';

type CategoryEdit = {
  id: string;
  name: string;
  capacity: string;
  priceRupees: string;
  teamSize: string;
  reservedCount: number;
  confirmedCount: number;
};

export function EventEditor({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventEditorInner slug={slug} eventId={eventId} />
    </OrganizeGate>
  );
}

function EventEditorInner({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [categoryEdits, setCategoryEdits] = useState<CategoryEdit[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCapacity, setNewCatCapacity] = useState('32');
  const [newCatPrice, setNewCatPrice] = useState('0');
  const [newCatTeam, setNewCatTeam] = useState('1');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function syncFromEvent(detail: OrganizerEventDetailDto) {
    setEvent(detail);
    setTitle(detail.title);
    setCity(detail.city);
    setVenue(detail.venue ?? '');
    setDescription(detail.description ?? '');
    setPosterUrl(detail.posterUrl ?? '');
    setCategoryEdits(
      detail.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        capacity: String(cat.capacity),
        priceRupees: String(Math.round(cat.priceMinor / 100)),
        teamSize: String(cat.teamSize),
        reservedCount: cat.reservedCount,
        confirmedCount: cat.confirmedCount,
      })),
    );
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        const detail = await auth.api.getOrganizerEvent(organizer.id, eventId);
        if (cancelled) return;
        setOrg(organizer);
        syncFromEvent(detail);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load event');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, slug]);

  async function save() {
    if (!org || !event) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.updateOrganizerEvent(org.id, event.id, {
        title,
        city,
        venue: venue || null,
        description: description || null,
        posterUrl: posterUrl.trim() || null,
      });
      syncFromEvent(updated);
      setMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setPending(false);
    }
  }

  async function saveCategory(row: CategoryEdit) {
    if (!org || !event) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.updateOrganizerEventCategory(org.id, event.id, row.id, {
        name: row.name.trim(),
        capacity: Number(row.capacity),
        priceMinor: Math.round(Number(row.priceRupees || 0) * 100),
        teamSize: Number(row.teamSize || 1),
      });
      syncFromEvent(updated);
      setMessage(`Updated “${row.name.trim()}”.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update category');
    } finally {
      setPending(false);
    }
  }

  async function removeCategory(row: CategoryEdit) {
    if (!org || !event) return;
    if (!window.confirm(`Delete category “${row.name}”?`)) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.deleteOrganizerEventCategory(org.id, event.id, row.id);
      syncFromEvent(updated);
      setMessage(`Deleted “${row.name}”.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category');
    } finally {
      setPending(false);
    }
  }

  async function addCategory() {
    if (!org || !event) return;
    const name = newCatName.trim();
    if (!name) {
      setError('Category name required');
      return;
    }
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.addOrganizerEventCategory(org.id, event.id, {
        name,
        capacity: Number(newCatCapacity),
        priceMinor: Math.round(Number(newCatPrice || 0) * 100),
        teamSize: Number(newCatTeam || 1),
      });
      syncFromEvent(updated);
      setNewCatName('');
      setNewCatCapacity('32');
      setNewCatPrice('0');
      setNewCatTeam('1');
      setMessage('Category added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    } finally {
      setPending(false);
    }
  }

  async function togglePublish() {
    if (!org || !event) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated =
        event.status === 'published'
          ? await auth.api.unpublishOrganizerEvent(org.id, event.id)
          : await auth.api.publishOrganizerEvent(org.id, event.id);
      syncFromEvent(updated);
      setMessage(updated.status === 'published' ? 'Live on Discover.' : 'Back to draft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setPending(false);
    }
  }

  if (error && !event) {
    return <p className="px-6 py-16 text-sm text-error">{error}</p>;
  }

  if (!org || !event) {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading event…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <p className="kicker text-accent">{org.orgName}</p>
        <h1 className="display-title text-5xl">{event.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant={event.status === 'published' ? 'lime' : 'muted'}>{event.status}</Badge>
          <Badge variant="outline">{event.eventType}</Badge>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label className="block space-y-2 text-sm text-text-secondary">
          Event title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          City
          <Input value={city} onChange={(e) => setCity(e.target.value)} required />
        </label>
        <label className="block space-y-2 text-sm text-text-secondary">
          Venue name
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Studio or address" />
        </label>

        <PosterField value={posterUrl} onChange={setPosterUrl} disabled={pending} />

        <label className="block space-y-2 text-sm text-text-secondary">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="flex w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </label>

        <div className="space-y-4 border border-border p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-muted">Registration categories</p>
            <p className="mt-1 text-xs text-text-muted">
              Edit a lane and save it, or delete if it has no holds/registrations. Keep at least one.
            </p>
          </div>

          {categoryEdits.map((row) => {
            const occupied = row.reservedCount + row.confirmedCount;
            const canDelete = categoryEdits.length > 1 && occupied === 0;
            return (
              <div key={row.id} className="space-y-3 border-t border-border pt-4">
                <label className="block space-y-2 text-sm text-text-secondary">
                  Category name
                  <Input
                    value={row.name}
                    onChange={(e) =>
                      setCategoryEdits((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, name: e.target.value } : item)),
                      )
                    }
                    placeholder="e.g. 1v1, 2v2, Open"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block space-y-2 text-sm text-text-secondary">
                    Max spots
                    <Input
                      type="number"
                      min={Math.max(1, occupied)}
                      value={row.capacity}
                      onChange={(e) =>
                        setCategoryEdits((rows) =>
                          rows.map((item) =>
                            item.id === row.id ? { ...item, capacity: e.target.value } : item,
                          ),
                        )
                      }
                    />
                    <span className="block text-[11px] text-text-muted">
                      {occupied} currently reserved/confirmed
                    </span>
                  </label>
                  <label className="block space-y-2 text-sm text-text-secondary">
                    Entry fee (₹)
                    <Input
                      type="number"
                      min={0}
                      value={row.priceRupees}
                      onChange={(e) =>
                        setCategoryEdits((rows) =>
                          rows.map((item) =>
                            item.id === row.id ? { ...item, priceRupees: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="0 for free"
                    />
                  </label>
                  <label className="block space-y-2 text-sm text-text-secondary">
                    Dancers per entry
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={row.teamSize}
                      onChange={(e) =>
                        setCategoryEdits((rows) =>
                          rows.map((item) =>
                            item.id === row.id ? { ...item, teamSize: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="1 for solo"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" disabled={pending} onClick={() => void saveCategory(row)}>
                    Save category
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending || !canDelete}
                    title={
                      !canDelete
                        ? occupied > 0
                          ? 'Category has reserved/confirmed spots'
                          : 'Keep at least one category'
                        : undefined
                    }
                    onClick={() => void removeCategory(row)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Add category</p>
            <label className="block space-y-2 text-sm text-text-secondary">
              Category name
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Open"
              />
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="block space-y-2 text-sm text-text-secondary">
                Max spots
                <Input
                  type="number"
                  min={1}
                  value={newCatCapacity}
                  onChange={(e) => setNewCatCapacity(e.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm text-text-secondary">
                Entry fee (₹)
                <Input
                  type="number"
                  min={0}
                  value={newCatPrice}
                  onChange={(e) => setNewCatPrice(e.target.value)}
                />
              </label>
              <label className="block space-y-2 text-sm text-text-secondary">
                Dancers per entry
                <Input
                  type="number"
                  min={1}
                  value={newCatTeam}
                  onChange={(e) => setNewCatTeam(e.target.value)}
                />
              </label>
            </div>
            <Button type="button" variant="outline" disabled={pending} onClick={() => void addCategory()}>
              Add category
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}
        {message ? <p className="text-sm text-success">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            Save event
          </Button>
          <Button type="button" variant="lime" disabled={pending} onClick={() => void togglePublish()}>
            {event.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
          {event.status === 'published' ? (
            <Button asChild variant="outline">
              <Link href={`${routes.events}/${event.slug}`}>View public</Link>
            </Button>
          ) : null}
        </div>
      </form>

      {org && event ? (
        <EventMediaLinksEditor
          organizerId={org.id}
          eventId={eventId}
          links={event.mediaLinks ?? []}
          categories={event.categories.map((c) => ({ id: c.id, name: c.name }))}
          onUpdated={(updated) => syncFromEvent(updated)}
        />
      ) : null}

      {org ? <EventRegistrationsPanel organizerId={org.id} eventId={eventId} /> : null}

      <Button asChild variant="ghost">
        <Link href={`${routes.organize}/${org.slug}`}>Back to organizer</Link>
      </Button>
    </div>
  );
}
