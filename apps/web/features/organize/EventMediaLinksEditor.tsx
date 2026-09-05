'use client';

import type { EventMediaLinkDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';

export function EventMediaLinksEditor({
  organizerId,
  eventId,
  links,
  categories,
  onUpdated,
}: {
  organizerId: string;
  eventId: string;
  links: EventMediaLinkDto[];
  categories: Array<{ id: string; name: string }>;
  onUpdated: (event: OrganizerEventDetailDto) => void;
}) {
  const { api } = useAuth();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addLink() {
    setPending(true);
    setError(null);
    try {
      const updated = await api.addOrganizerEventMediaLink(organizerId, eventId, {
        title: title.trim(),
        url: url.trim(),
        categoryId: categoryId || null,
      });
      onUpdated(updated);
      setTitle('');
      setUrl('');
      setCategoryId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add link');
    } finally {
      setPending(false);
    }
  }

  async function removeLink(mediaLinkId: string) {
    setPending(true);
    setError(null);
    try {
      const updated = await api.deleteOrganizerEventMediaLink(organizerId, eventId, mediaLinkId);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete link');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <div>
        <p className="kicker text-accent">Links</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Event media</h2>
        <p className="mt-1 text-sm text-text-secondary">
          YouTube, Instagram, Drive, or other URLs — Cypher does not host video.
        </p>
      </div>

      {links.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-elevated px-4 py-6">
          <p className="text-sm text-text-secondary">
            No media links yet. Add a YouTube, Instagram, or Drive URL below — Cypher does not host video.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {links.map((link) => (
            <li key={link.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-text-primary">{link.title}</p>
                <p className="truncate text-sm text-text-secondary">{link.url}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-text-muted">
                  {link.kind}
                  {link.categoryId
                    ? ` · ${categories.find((c) => c.id === link.categoryId)?.name ?? 'category'}`
                    : null}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => void removeLink(link.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Title</p>
          <Input
            id="media-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Finals stream"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted">URL</p>
          <Input
            id="media-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            disabled={pending}
          />
        </div>
      </div>
      {categories.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Category (optional)</p>
          <select
            id="media-category"
            className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-text-primary"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={pending}
          >
            <option value="">Whole event</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button
        type="button"
        variant="outline"
        disabled={pending || !title.trim() || !url.trim()}
        onClick={() => void addLink()}
      >
        Add media link
      </Button>
    </section>
  );
}
