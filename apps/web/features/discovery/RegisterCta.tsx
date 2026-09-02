'use client';

import type { EventCardDto } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';

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

interface RegisterCtaProps {
  event: EventCardDto;
  spotsLeft: number;
}

export function RegisterCta({ event, spotsLeft }: RegisterCtaProps) {
  const price = event.priceMinor === 0 ? 'Free entry' : formatMinorUnits(event.priceMinor);
  const soldOut = spotsLeft === 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" disabled={soldOut}>
          {soldOut ? 'Join waitlist' : 'Register now'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hold a spot</DialogTitle>
          <DialogDescription>
            Checkout wires to Razorpay in the API milestone. This preview locks the category and price so
            the floor count cannot drift.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-border bg-elevated p-4 text-sm">
          <p className="font-display text-2xl uppercase tracking-[0.06em]">{event.title}</p>
          <p className="mt-1 text-text-secondary">{event.venue ?? event.city}</p>
          <p className="mt-3 text-text-primary">{price}</p>
        </div>
        <DialogFooter>
          <Button disabled>Pay with Razorpay</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
