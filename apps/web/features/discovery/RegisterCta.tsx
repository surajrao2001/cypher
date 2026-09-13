'use client';

import type { EventDetailDto, RegistrationDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits, spotsLeft as calcSpotsLeft } from '@cypher/utils';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

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
import {
  toastCopy,
  toastDismiss,
  toastInfo,
  toastPending,
  toastReject,
  toastResolve,
} from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  OPEN_REGISTER_EVENT,
  type OpenRegisterDetail,
} from '@/features/discovery/register-events';
import { openCashfreeCheckout } from '@/features/payments/cashfree-checkout';
import { friendlyError, InlineNotice } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

interface RegisterCtaProps {
  event: EventDetailDto;
  spotsLeft: number;
}

type Mode = 'compete' | 'watch';
type Step = 'category' | 'details' | 'pay' | 'confirm';

export function RegisterCta({ event }: RegisterCtaProps) {
  const { token, me, api } = useAuth();
  const compete = event.competeCategories?.length
    ? event.competeCategories
    : event.categories.filter((c) => c.entryType !== 'viewer');
  const viewers = event.viewerCategories?.length
    ? event.viewerCategories
    : event.categories.filter((c) => c.entryType === 'viewer');

  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<Step>('category');
  const [categoryId, setCategoryId] = useState(compete[0]?.id ?? '');
  const [viewerCategoryId, setViewerCategoryId] = useState(viewers[0]?.id ?? '');
  const [entryName, setEntryName] = useState('');
  const [names, setNames] = useState<string[]>(['']);
  const [customerPhone, setCustomerPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<RegistrationDto | null>(null);

  const category = useMemo(() => {
    if (mode === 'watch') {
      return viewers.find((row) => row.id === viewerCategoryId) ?? viewers[0];
    }
    return compete.find((row) => row.id === categoryId) ?? compete[0];
  }, [categoryId, compete, mode, viewerCategoryId, viewers]);

  const sellPrice = category?.currentPriceMinor ?? category?.priceMinor ?? 0;

  const categorySpotsLeft = category
    ? calcSpotsLeft(category.capacity, category.confirmedCount + category.reservedCount)
    : 0;
  const soldOut = categorySpotsLeft === 0;
  const minSize = mode === 'watch' ? 1 : (category?.minTeamSize ?? 1);
  const maxSize = mode === 'watch' ? 1 : (category?.maxTeamSize ?? 1);
  const open = mode !== null;
  const isConfirmed = held?.registrationStatus === 'confirmed';
  const needsPay = Boolean(held && !isConfirmed && held.totalAmountMinor > 0);

  const stepList = useMemo(() => {
    const steps: Array<{ id: Step; label: string }> = [];
    if (mode === 'compete' || (mode === 'watch' && viewers.length > 1)) {
      steps.push({ id: 'category', label: 'Entry' });
    }
    steps.push({ id: 'details', label: 'Who’s entering' });
    if (held && held.totalAmountMinor > 0) steps.push({ id: 'pay', label: 'Pay' });
    if (held || isConfirmed) steps.push({ id: 'confirm', label: 'Confirm' });
    return steps;
  }, [held, isConfirmed, mode, viewers.length]);

  function openMode(next: Mode, preferredCategoryId?: string) {
    setMode(next);
    setHeld(null);
    setError(null);
    setEntryName('');
    setCustomerPhone('');
    if (next === 'compete') {
      const first =
        (preferredCategoryId
          ? compete.find((row) => row.id === preferredCategoryId)
          : undefined) ?? compete[0];
      setCategoryId(first?.id ?? '');
      setNames(Array.from({ length: first?.minTeamSize ?? 1 }, () => ''));
      setStep(compete.length > 1 && !preferredCategoryId ? 'category' : 'details');
    } else {
      const first =
        (preferredCategoryId
          ? viewers.find((row) => row.id === preferredCategoryId)
          : undefined) ?? viewers[0];
      setViewerCategoryId(first?.id ?? '');
      setNames(['']);
      setStep(viewers.length > 1 && !preferredCategoryId ? 'category' : 'details');
    }
  }

  const openModeRef = useRef(openMode);
  openModeRef.current = openMode;

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<OpenRegisterDetail>).detail;
      if (!detail?.mode) return;
      openModeRef.current(detail.mode, detail.categoryId);
    }
    window.addEventListener(OPEN_REGISTER_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_REGISTER_EVENT, onOpen);
  }, []);

  function syncParticipantSlots(nextCategoryId: string) {
    const next = compete.find((row) => row.id === nextCategoryId);
    const size = next?.minTeamSize ?? 1;
    setCategoryId(nextCategoryId);
    setNames(Array.from({ length: size }, (_, index) => names[index] ?? ''));
    setError(null);
  }

  async function submit() {
    if (!token || !me || !category) {
      setError('Choose a category');
      return;
    }
    const trimmed =
      mode === 'watch'
        ? [(names[0] || me.profile.dancerName || me.profile.name || 'Guest').trim()].filter(Boolean)
        : names.map((name) => name.trim()).filter(Boolean);
    if (trimmed.length < minSize || trimmed.length > maxSize) {
      setError(`Add ${minSize === maxSize ? minSize : `${minSize}-${maxSize}`} participants`);
      return;
    }
    setBusy(true);
    setError(null);
    const tid = toastPending(toastCopy.registering);
    try {
      let registration = await api.createRegistration({
        categoryId: category.id,
        entryName: mode === 'compete' && entryName.trim() ? entryName.trim() : undefined,
        participants: trimmed.map((displayName, index) => ({
          displayName,
          dancerName: index === 0 ? me.profile.dancerName ?? undefined : undefined,
          userId: index === 0 ? me.userId : undefined,
          isTeamCaptain: index === 0,
        })),
      });
      if (registration.totalAmountMinor === 0) {
        registration = await api.confirmFreeRegistration(registration.id);
        setHeld(registration);
        setStep('confirm');
        toastResolve(tid, toastCopy.confirmed);
      } else {
        setHeld(registration);
        setStep('pay');
        toastResolve(tid, toastCopy.registered);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : undefined;
      toastReject(tid, toastCopy.registerFailed, detail);
      setError(friendlyError(err, 'Could not register'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmHeld() {
    if (!held || held.totalAmountMinor !== 0) return;
    setBusy(true);
    setError(null);
    const tid = toastPending(toastCopy.registering);
    try {
      const next = await api.confirmFreeRegistration(held.id);
      setHeld(next);
      setStep('confirm');
      toastResolve(tid, toastCopy.confirmed);
    } catch (err) {
      const detail = err instanceof Error ? err.message : undefined;
      toastReject(tid, toastCopy.registerFailed, detail);
      setError(friendlyError(err, 'Could not confirm'));
    } finally {
      setBusy(false);
    }
  }

  async function payHeld() {
    if (!held || held.totalAmountMinor <= 0) return;
    const phone = customerPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit Indian mobile for checkout');
      return;
    }
    setBusy(true);
    setError(null);
    const tid = toastPending(toastCopy.paying);
    try {
      const session = await api.createRegistrationCheckout(held.id, { customerPhone: phone });
      const checkout = await openCashfreeCheckout(session.paymentSessionId);
      if (checkout.error) {
        toastReject(tid, toastCopy.payCancelled, checkout.error.message);
        setError(friendlyError(checkout.error, toastCopy.payCancelled));
        return;
      }
      for (let attempt = 0; attempt < 12; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 800 : 1500));
        try {
          const latest = await api.reconcileRegistrationCheckout(held.id);
          setHeld(latest);
          if (latest.registrationStatus === 'confirmed') {
            setStep('confirm');
            toastResolve(tid, toastCopy.payDone);
            return;
          }
        } catch {
          const latest = await api.getRegistration(held.id);
          setHeld(latest);
          if (latest.registrationStatus === 'confirmed') {
            setStep('confirm');
            toastResolve(tid, toastCopy.payDone);
            return;
          }
        }
      }
      toastInfo(toastCopy.payDone, 'Open Passes if it is not there yet.');
      toastDismiss(tid);
      setError('Payment submitted — check Passes shortly.');
    } catch (err) {
      const detail = err instanceof Error ? err.message : undefined;
      toastReject(tid, toastCopy.payFailed, detail);
      setError(friendlyError(err, 'Could not start payment'));
    } finally {
      setBusy(false);
    }
  }

  const competeSoldOut = compete.every(
    (row) => calcSpotsLeft(row.capacity, row.confirmedCount + row.reservedCount) === 0,
  );
  const watchSoldOut =
    viewers.length === 0 ||
    viewers.every(
      (row) => calcSpotsLeft(row.capacity, row.confirmedCount + row.reservedCount) === 0,
    );
  const watchFromPrice = viewers.reduce(
    (min, row) => Math.min(min, row.currentPriceMinor ?? row.priceMinor),
    viewers[0]?.currentPriceMinor ?? viewers[0]?.priceMinor ?? 0,
  );
  const feeMinor = held?.totalAmountMinor ?? sellPrice;
  const hasEntry = compete.length > 0 || viewers.length > 0;
  const registrationClosed = event.status === 'registration_closed';

  if (!hasEntry) {
    return null;
  }

  if (registrationClosed) {
    return (
      <Button size="lg" disabled>
        Registration closed
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {compete.length > 0 ? (
        <Button size="lg" disabled={competeSoldOut} onClick={() => openMode('compete')}>
          {competeSoldOut ? 'Compete sold out' : 'Compete'}
        </Button>
      ) : null}
      {viewers.length > 0 ? (
        <Button
          size="lg"
          variant={compete.length > 0 ? 'outline' : 'default'}
          disabled={watchSoldOut}
          onClick={() => openMode('watch')}
        >
          {watchSoldOut
            ? 'Watch · Sold out'
            : `Watch · ${watchFromPrice === 0 ? 'Free' : `from ${formatMinorUnits(watchFromPrice)}`}`}
        </Button>
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setMode(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isConfirmed
                ? 'You’re in'
                : mode === 'watch'
                  ? 'Audience pass'
                  : 'Get in'}
            </DialogTitle>
            <DialogDescription>
              {isConfirmed
                ? 'Your pass is ready. Open Passes for your QR.'
                : mode === 'watch'
                  ? 'Watch the floor — no competition entry needed.'
                  : 'Choose your entry, add who’s entering, then confirm.'}
            </DialogDescription>
          </DialogHeader>

          {stepList.length > 1 ? (
            <ol className="flex flex-wrap gap-2 border-b border-border pb-3">
              {stepList.map((item, index) => {
                const active = item.id === step;
                const done = stepList.findIndex((s) => s.id === step) > index;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'text-[11px] font-semibold uppercase tracking-[0.12em]',
                      active ? 'text-accent' : done ? 'text-text-secondary' : 'text-text-muted',
                    )}
                  >
                    {index + 1}. {item.label}
                    {index < stepList.length - 1 ? (
                      <span className="ml-2 text-text-muted">/</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : null}

          {!token || !me ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">Sign in to hold a spot.</p>
              <Button asChild>
                <Link href={`${routes.login}?next=/events/${event.slug}`}>Sign in</Link>
              </Button>
            </div>
          ) : isConfirmed && held ? (
            <SummaryCard
              title={held.category.entryType === 'viewer' ? 'Audience pass' : held.category.name}
              code={held.registrationCode}
              feeMinor={held.totalAmountMinor}
              status="Confirmed"
            />
          ) : held && step === 'pay' ? (
            <div className="space-y-4">
              <SummaryCard
                title={held.category.entryType === 'viewer' ? 'Audience pass' : held.category.name}
                code={held.registrationCode}
                feeMinor={held.totalAmountMinor}
                status="Spot held"
                expiresAt={held.reservationExpiresAt}
              />
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.14em] text-text-muted" htmlFor="pay-phone">
                  Mobile for payment
                </label>
                <Input
                  id="pay-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  inputMode="numeric"
                />
              </div>
              {error ? <InlineNotice tone="warn">{error}</InlineNotice> : null}
            </div>
          ) : held && !isConfirmed && held.totalAmountMinor === 0 ? (
            <div className="space-y-4">
              <SummaryCard
                title={held.category.entryType === 'viewer' ? 'Audience pass' : held.category.name}
                code={held.registrationCode}
                feeMinor={0}
                status="Confirm free entry"
                expiresAt={held.reservationExpiresAt}
              />
              {error ? <InlineNotice tone="warn">{error}</InlineNotice> : null}
            </div>
          ) : step === 'category' && mode === 'watch' ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Choose pass</p>
              <ul className="space-y-2">
                {viewers.map((row) => {
                  const left = calcSpotsLeft(row.capacity, row.confirmedCount + row.reservedCount);
                  const price = row.currentPriceMinor ?? row.priceMinor;
                  const selected = category?.id === row.id;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        disabled={left === 0}
                        onClick={() => {
                          setViewerCategoryId(row.id);
                          setError(null);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                          selected
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-elevated hover:border-accent/40',
                          left === 0 && 'opacity-40',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-text-primary">{row.name}</span>
                          <span className="block text-xs text-text-muted">
                            {price === 0 ? 'Free' : formatMinorUnits(price)}
                            {row.activeTierName ? ` · ${row.activeTierName}` : ''} · {left} left
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : step === 'category' && mode === 'compete' ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">Choose category</p>
              <ul className="space-y-2">
                {compete.map((row) => {
                  const left = calcSpotsLeft(row.capacity, row.confirmedCount + row.reservedCount);
                  const selected = category?.id === row.id;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        disabled={left === 0}
                        onClick={() => syncParticipantSlots(row.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                          selected
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-elevated hover:border-accent/40',
                          left === 0 && 'opacity-40',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                            selected ? 'border-accent bg-accent' : 'border-border',
                          )}
                        >
                          {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-text-primary">{row.name}</span>
                          <span className="block text-xs text-text-muted">
                            {(row.currentPriceMinor ?? row.priceMinor) === 0
                              ? 'Free'
                              : formatMinorUnits(row.currentPriceMinor ?? row.priceMinor)}{' '}
                            · {left} left
                            {row.activeTierName ? ` · ${row.activeTierName}` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <SummaryCard
                title={
                  mode === 'watch'
                    ? category?.name || 'Audience pass'
                    : category?.name ?? 'Category'
                }
                feeMinor={feeMinor}
                status={`${categorySpotsLeft} spots left`}
              />
              {mode === 'watch' ? (
                <label className="block space-y-2 text-sm text-text-secondary">
                  Your name
                  <Input
                    value={names[0] ?? ''}
                    onChange={(e) => setNames([e.target.value])}
                    placeholder={me.profile.dancerName ?? me.profile.name ?? 'Name on the pass'}
                  />
                </label>
              ) : (
                <>
                  {maxSize > 1 ? (
                    <label className="block space-y-2 text-sm text-text-secondary">
                      Team / entry name
                      <Input
                        value={entryName}
                        onChange={(e) => setEntryName(e.target.value)}
                        placeholder="Optional"
                      />
                    </label>
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
                        onChange={(e) => {
                          const next = [...names];
                          next[index] = e.target.value;
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
                </>
              )}
              {error ? <InlineNotice tone="warn">{error}</InlineNotice> : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {token && me && step === 'category' && !held ? (
              <>
                <span />
                <Button type="button" onClick={() => setStep('details')} disabled={!category || soldOut}>
                  Continue
                </Button>
              </>
            ) : null}
            {token && me && step === 'details' && !held ? (
              <>
                {(mode === 'compete' && compete.length > 1) || (mode === 'watch' && viewers.length > 1) ? (
                  <Button type="button" variant="ghost" onClick={() => setStep('category')}>
                    Back
                  </Button>
                ) : (
                  <span />
                )}
                <Button onClick={() => void submit()} disabled={busy || soldOut}>
                  {busy
                    ? 'Working…'
                    : sellPrice === 0
                      ? mode === 'watch'
                        ? 'Get free pass'
                        : 'Register free'
                      : 'Hold spot'}
                </Button>
              </>
            ) : null}
            {token && me && held && !isConfirmed && held.totalAmountMinor === 0 ? (
              <Button onClick={() => void confirmHeld()} disabled={busy}>
                {busy ? 'Confirming…' : 'Confirm free entry'}
              </Button>
            ) : null}
            {token && me && needsPay ? (
              <Button onClick={() => void payHeld()} disabled={busy}>
                {busy ? 'Opening secure payment…' : `Pay ${formatMinorUnits(held!.totalAmountMinor)}`}
              </Button>
            ) : null}
            {isConfirmed ? (
              <Button asChild>
                <Link href={routes.tickets}>Open tickets</Link>
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  code,
  feeMinor,
  status,
  expiresAt,
}: {
  title: string;
  code?: string;
  feeMinor: number;
  status: string;
  expiresAt?: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-elevated p-4 text-sm">
      <p className="font-display text-2xl uppercase tracking-[0.06em]">{title}</p>
      {code ? <p className="mt-1 text-text-secondary">Code {code}</p> : null}
      <p className="mt-1 text-text-secondary">{status}</p>
      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-xs uppercase tracking-[0.14em] text-text-muted">Entry fee</span>
        <span className="font-semibold text-text-primary">
          {feeMinor === 0 ? 'Free' : formatMinorUnits(feeMinor)}
        </span>
      </div>
      {expiresAt ? (
        <p className="mt-2 text-xs text-accent">
          Hold expires {new Date(expiresAt).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
