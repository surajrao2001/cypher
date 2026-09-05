'use client';

import type { EventDetailDto, RegistrationDto } from '@cypher/contracts';
import { formatMinorUnits, spotsLeft as calcSpotsLeft } from '@cypher/utils';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { routes } from '@cypher/contracts';

interface RegisterCtaProps {
  event: EventDetailDto;
  spotsLeft: number;
}

export function RegisterCta({ event, spotsLeft }: RegisterCtaProps) {
  const { token, me, api } = useAuth();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(event.categories[0]?.id ?? '');
  const [entryName, setEntryName] = useState('');
  const [names, setNames] = useState<string[]>(['']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<RegistrationDto | null>(null);

  const category = useMemo(
    () => event.categories.find((row) => row.id === categoryId) ?? event.categories[0],
    [categoryId, event.categories],
  );

  const categorySpotsLeft = category
    ? calcSpotsLeft(category.capacity, category.confirmedCount + category.reservedCount)
    : 0;
  const soldOut = spotsLeft === 0 || categorySpotsLeft === 0;
  const minSize = category?.minTeamSize ?? 1;
  const maxSize = category?.maxTeamSize ?? 1;

  function syncParticipantSlots(nextCategoryId: string) {
    const next = event.categories.find((row) => row.id === nextCategoryId);
    const size = next?.minTeamSize ?? 1;
    setCategoryId(nextCategoryId);
    setNames(Array.from({ length: size }, (_, index) => names[index] ?? ''));
    setError(null);
    setHeld(null);
  }

  async function submit() {
    if (!token || !me) {
      return;
    }
    if (!category) {
      setError('Choose a category');
      return;
    }
    const trimmed = names.map((name) => name.trim()).filter(Boolean);
    if (trimmed.length < minSize || trimmed.length > maxSize) {
      setError(`Add ${minSize === maxSize ? minSize : `${minSize}-${maxSize}`} participants`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let registration = await api.createRegistration({
        categoryId: category.id,
        entryName: entryName.trim() || undefined,
        participants: trimmed.map((displayName, index) => ({
          displayName,
          dancerName: index === 0 ? me.profile.dancerName ?? undefined : undefined,
          userId: index === 0 ? me.profile.id : undefined,
          isTeamCaptain: index === 0,
        })),
      });
      if (registration.totalAmountMinor === 0) {
        registration = await api.confirmFreeRegistration(registration.id);
      }
      setHeld(registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register');
    } finally {
      setBusy(false);
    }
  }

  async function confirmHeld() {
    if (!held || held.totalAmountMinor !== 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setHeld(await api.confirmFreeRegistration(held.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm');
    } finally {
      setBusy(false);
    }
  }

  const isConfirmed = held?.registrationStatus === 'confirmed';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" disabled={soldOut && !held}>
          {soldOut ? 'Sold out' : 'Register now'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isConfirmed ? 'Registered' : held ? 'Spot held' : 'Choose category'}
          </DialogTitle>
          <DialogDescription>
            {isConfirmed
              ? 'Your free entry is confirmed. Ticket / My Events comes next.'
              : held
                ? held.totalAmountMinor === 0
                  ? 'Confirm your free entry to lock the spot.'
                  : 'Paid checkout is not wired yet — hold only for now.'
                : 'Register for one category entry. Capacity counts teams, not dancers.'}
          </DialogDescription>
        </DialogHeader>

        {!token || !me ? (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Sign in with phone OTP to hold a spot.</p>
            <Button asChild>
              <Link href={`${routes.login}?next=/events/${event.slug}`}>Sign in</Link>
            </Button>
          </div>
        ) : held ? (
          <div className="space-y-3 rounded-md border border-border bg-elevated p-4 text-sm">
            <p className="font-display text-2xl uppercase tracking-[0.06em]">{held.category.name}</p>
            <p className="text-text-secondary">Code {held.registrationCode}</p>
            <p className="text-text-secondary">Status {held.registrationStatus}</p>
            {!isConfirmed && held.reservationExpiresAt ? (
              <p className="text-text-secondary">
                Hold expires {new Date(held.reservationExpiresAt).toLocaleString()}
              </p>
            ) : null}
            <p className="text-text-primary">
              {held.totalAmountMinor === 0 ? 'Free entry' : formatMinorUnits(held.totalAmountMinor)}
            </p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Category</p>
              <select
                className="flex h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm"
                value={category?.id}
                onChange={(event) => syncParticipantSlots(event.target.value)}
              >
                {event.categories.map((row) => {
                  const left = calcSpotsLeft(row.capacity, row.confirmedCount + row.reservedCount);
                  return (
                    <option key={row.id} value={row.id} disabled={left === 0}>
                      {row.name} · {row.priceMinor === 0 ? 'Free' : formatMinorUnits(row.priceMinor)} ·{' '}
                      {left} left
                    </option>
                  );
                })}
              </select>
            </div>

            {maxSize > 1 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Team / entry name</p>
                <Input
                  id="entryName"
                  value={entryName}
                  onChange={(event) => setEntryName(event.target.value)}
                  placeholder="Optional"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Participants ({minSize === maxSize ? minSize : `${minSize}–${maxSize}`})
              </p>
              {names.map((name, index) => (
                <Input
                  key={`p-${String(index)}`}
                  value={name}
                  placeholder={index === 0 ? 'Captain / you' : `Dancer ${String(index + 1)}`}
                  onChange={(event) => {
                    const next = [...names];
                    next[index] = event.target.value;
                    setNames(next);
                  }}
                />
              ))}
              {names.length < maxSize ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNames([...names, ''])}
                >
                  Add dancer
                </Button>
              ) : null}
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>
        )}

        <DialogFooter>
          {token && me && !held ? (
            <Button onClick={() => void submit()} disabled={busy || soldOut}>
              {busy ? 'Working…' : category?.priceMinor === 0 ? 'Register free' : 'Hold spot'}
            </Button>
          ) : null}
          {token && me && held && !isConfirmed && held.totalAmountMinor === 0 ? (
            <Button onClick={() => void confirmHeld()} disabled={busy}>
              {busy ? 'Confirming…' : 'Confirm free entry'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
