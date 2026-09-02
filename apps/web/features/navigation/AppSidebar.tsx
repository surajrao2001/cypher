'use client';

import { routes } from '@cypher/contracts';
import {
  Bookmark,
  Compass,
  CircleHelp,
  CalendarDays,
  Map,
  PlayCircle,
  Ticket,
  UserRound,
  Users,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

const navItems = [
  { href: routes.discover, label: 'Discover', icon: Compass },
  { href: routes.events, label: 'Events', icon: CalendarDays },
  { href: routes.map, label: 'Map', icon: Map },
  { href: routes.videos, label: 'Videos', icon: PlayCircle },
  { href: routes.organizers, label: 'Organizers', icon: Users },
  { href: routes.tickets, label: 'Tickets', icon: Ticket },
  { href: routes.profile, label: 'Profile', icon: UserRound },
  { href: routes.saved, label: 'Saved', icon: Bookmark },
] as const;

function BrandMark() {
  return (
    <Link href={routes.discover} className="flex items-center gap-3 px-1">
      <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent font-display text-xl tracking-[0.08em] text-white">
        NC
      </span>
      <span className="min-w-0">
        <span className="block font-display text-2xl leading-none tracking-[0.08em] text-text-primary">
          Night Cypher
        </span>
        <span className="kicker mt-1 block text-[10px]">Battles · India</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm font-medium tracking-wide transition-colors',
              active
                ? 'bg-elevated text-text-primary shadow-[inset_3px_0_0_0_var(--accent-primary)]'
                : 'text-text-secondary hover:bg-elevated hover:text-text-primary',
            )}
          >
            <Icon className={cn('h-4 w-4', active ? 'text-accent' : 'text-text-muted')} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SupportSlot() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 normal-case tracking-normal">
          <CircleHelp className="h-4 w-4 text-text-muted" />
          Help & support
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Need the floor?</DialogTitle>
          <DialogDescription>
            Night Cypher support is built for battle weekends — registration holds, Razorpay failures, and
            organizer check-in. No theme toggle. Dark is the product.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-md border border-border bg-elevated p-4 text-sm text-text-secondary">
          <p>
            WhatsApp desk: <span className="text-text-primary">+91 22 4155 0190</span>
          </p>
          <p>
            Email: <span className="text-text-primary">floor@nightcypher.in</span>
          </p>
          <p>Hours: Fri–Sun, 10:00–02:00 IST during event weeks.</p>
        </div>
        <DialogFooter>
          <Button asChild>
            <a href="mailto:floor@nightcypher.in">Ping support</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuthSlot({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth();
  const name = auth.me?.profile.dancerName ?? auth.me?.profile.name;

  if (!auth.ready) {
    return <p className="px-3 text-xs text-text-muted">Session…</p>;
  }

  if (!auth.token) {
    return (
      <Button asChild variant="default" className="w-full">
        <Link href={routes.login} onClick={onNavigate}>
          Enter with OTP
        </Link>
      </Button>
    );
  }

  return (
    <Link
      href={routes.profile}
      onClick={onNavigate}
      className="block rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary"
    >
      <span className="kicker block text-[10px] text-accent">Signed in</span>
      {name}
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <BrandMark />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <AuthSlot onNavigate={onNavigate} />
        <SupportSlot />
        <p className="px-3 text-[10px] uppercase tracking-[0.18em] text-text-muted">Floor stays dark</p>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <SidebarBody />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 bg-surface lg:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex h-full w-72 flex-col p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Night Cypher</SheetTitle>
        </SheetHeader>
        <SidebarBody onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
