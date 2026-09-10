'use client';

import type { EventUpdateDto, OrganizerDto } from '@cypher/contracts';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { PosterField } from '@/features/organize/PosterField';
import { TabEmptyState } from '@/features/organize/TabEmptyState';
import { PageLoading } from '@/features/shell/AsyncState';

/** Past updates only — compose lives in PostUpdateDialog. */
export function EventUpdatesPanel({
  organizerId,
  eventId,
  refreshKey = 0,
}: {
  organizerId: string;
  eventId: string;
  /** Bump after posting so the list reloads. */
  refreshKey?: number;
}) {
  const { api } = useAuth();
  const [items, setItems] = useState<EventUpdateDto[]>([]);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const res = await api.listEventUpdates(organizerId, eventId);
    setItems(res.items);
  }, [api, eventId, organizerId]);

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, [load, refreshKey]);

  async function remove(id: string) {
    setPending(true);
    try {
      await api.deleteEventUpdate(organizerId, eventId, id);
      await load();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl tracking-[0.04em]">Updates</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Everything you’ve posted for this night. Use Post update next to Edit to drop a new one.
        </p>
      </div>

      {items.length === 0 ? (
        <TabEmptyState
          icon="megaphone"
          kicker="Radio silence"
          title="No drops yet"
          body="Hit Post update when you’ve got news, rules, or wholesome chaos to share."
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.id} className="space-y-2 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {item.title ? (
                  <p className="font-semibold text-text-primary">{item.title}</p>
                ) : (
                  <p className="text-xs text-text-muted">Update</p>
                )}
                <button
                  type="button"
                  className="text-xs text-text-muted hover:text-error"
                  disabled={pending}
                  onClick={() => void remove(item.id)}
                >
                  Delete
                </button>
              </div>
              {item.posterUrl ? (
                <div className="overflow-hidden rounded-md border border-border bg-elevated">
                  <img src={item.posterUrl} alt="" className="max-h-80 w-full object-cover" />
                </div>
              ) : null}
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{item.body}</p>
              <p className="text-xs text-text-muted">
                {new Date(item.publishedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PostUpdateDialog({
  organizerId,
  eventId,
  open,
  onOpenChange,
  onPosted,
}: {
  organizerId: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPosted?: () => void;
}) {
  const { api } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [pending, setPending] = useState(false);

  function reset() {
    setTitle('');
    setBody('');
    setPosterUrl('');
  }

  async function publish() {
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      if (!body.trim()) throw new Error('Write something for the feed');
      await api.createEventUpdate(organizerId, eventId, {
        title: title.trim() || null,
        body: body.trim(),
        posterUrl: posterUrl.trim() || null,
      });
      reset();
      onOpenChange(false);
      onPosted?.();
      toastResolve(tid, 'Update posted');
    } catch (err) {
      toastReject(tid, toastCopy.saveFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md gap-3 overflow-hidden p-5">
        <DialogHeader className="shrink-0 space-y-1 pr-6">
          <DialogTitle className="text-2xl">Post update</DialogTitle>
          <DialogDescription>
            News, rules, day-of notes — optional poster if you’ve got one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="space-y-2 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Title (optional)</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full lineup locked"
              disabled={pending}
            />
          </div>
          <div className="space-y-2 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Body</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="flex w-full resize-none rounded-md border border-border bg-elevated px-3 py-2 text-sm"
              placeholder="What’s new for the night?"
              disabled={pending}
            />
          </div>
          <PosterField
            value={posterUrl}
            onChange={setPosterUrl}
            disabled={pending}
            compact
            label="Poster (optional)"
            hint="JPEG, PNG, WebP or GIF · max 5MB"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={() => void publish()}>
            {pending ? 'Posting…' : 'Post update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Convenience loader when only slug is known. */
export function EventUpdatesPanelBySlug({
  slug,
  eventId,
}: {
  slug: string;
  eventId: string;
}) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  useEffect(() => {
    void auth.api.getMyOrganizerBySlug(slug).then(setOrg);
  }, [auth.api, slug]);
  if (!org) return <PageLoading variant="panel" label="Loading updates" />;
  return <EventUpdatesPanel organizerId={org.id} eventId={eventId} />;
}
