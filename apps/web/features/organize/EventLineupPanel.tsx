'use client';

import type { EventUpdateDto, OrganizerEventDetailDto } from '@cypher/contracts';
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
import { toastCopy, toastError, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { PosterField } from '@/features/organize/PosterField';
import { TabEmptyState } from '@/features/organize/TabEmptyState';
import { Image as ImageIcon } from 'lucide-react';

/** Gallery only — compose lives in DropLineupDialog. */
export function EventLineupPanel({
  organizerId,
  eventId,
  event,
  refreshKey = 0,
}: {
  organizerId: string;
  eventId: string;
  event: OrganizerEventDetailDto;
  refreshKey?: number;
}) {
  const { api } = useAuth();
  const [drops, setDrops] = useState<EventUpdateDto[]>([]);
  const [pending, setPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await api.listEventUpdates(organizerId, eventId);
    setDrops(res.items.filter((item) => item.kind === 'LINEUP' && item.posterUrl));
  }, [api, eventId, organizerId]);

  useEffect(() => {
    void load().catch(() => setDrops([]));
  }, [load, refreshKey]);

  async function removeDrop(id: string) {
    setPending(true);
    try {
      await api.deleteEventUpdate(organizerId, eventId, id);
      await load();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-[0.04em]">Lineup</h2>
          <p className="mt-1 max-w-lg text-sm text-text-secondary">
            Posters for the cast. One graphic can carry the whole night.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          Drop poster
        </Button>
      </div>

      {drops.length === 0 ? (
        <TabEmptyState
          icon={ImageIcon}
          kicker="Poster drop"
          title="No lineup graphic yet"
          body="One flyer can carry the whole cast. Use Drop poster above when you’re ready to flex."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {drops.map((drop) => (
            <li key={drop.id} className="space-y-2">
              <div className="overflow-hidden rounded-md border border-border bg-elevated">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={drop.posterUrl!}
                  alt={drop.title ?? 'Lineup poster'}
                  className="max-h-96 w-full object-cover"
                />
              </div>
              {drop.title ? (
                <p className="text-sm font-semibold text-text-primary">{drop.title}</p>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-text-muted">
                  {new Date(drop.publishedAt).toLocaleString()}
                </p>
                <button
                  type="button"
                  className="text-xs text-text-muted hover:text-error"
                  disabled={pending}
                  onClick={() => void removeDrop(drop.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DropLineupDialog
        organizerId={organizerId}
        eventId={eventId}
        eventTitle={event.title}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPosted={() => void load()}
      />
    </div>
  );
}

function DropLineupDialog({
  organizerId,
  eventId,
  eventTitle,
  open,
  onOpenChange,
  onPosted,
}: {
  organizerId: string;
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPosted?: () => void;
}) {
  const { api } = useAuth();
  const [posterUrl, setPosterUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [pending, setPending] = useState(false);

  function reset() {
    setPosterUrl('');
    setCaption('');
  }

  async function publish() {
    if (!posterUrl.trim()) {
      toastError('Add the lineup poster first');
      return;
    }
    setPending(true);
    const tid = toastPending(toastCopy.saving);
    try {
      await api.createEventUpdate(organizerId, eventId, {
        kind: 'LINEUP',
        title: caption.trim() || null,
        body: `Lineup drop — ${eventTitle}`,
        posterUrl: posterUrl.trim(),
      });
      reset();
      onOpenChange(false);
      onPosted?.();
      toastResolve(tid, 'Lineup poster live');
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
        <DialogHeader className="space-y-1 pr-6">
          <DialogTitle className="text-2xl">Drop lineup poster</DialogTitle>
          <DialogDescription>Graphic first. Caption optional.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">Caption (optional)</span>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Full lineup locked"
            disabled={pending}
          />
        </div>

        <PosterField
          value={posterUrl}
          onChange={setPosterUrl}
          disabled={pending}
          compact
          label="Poster"
          hint="JPEG, PNG, WebP or GIF · max 5MB"
        />

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !posterUrl.trim()}
            onClick={() => void publish()}
          >
            {pending ? 'Posting…' : 'Drop poster'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
