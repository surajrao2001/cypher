'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { ByndIcon } from '@/components/icons/bynd8';
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
import { LEGAL_URLS } from '@/lib/release';
import { cn } from '@/lib/utils';

const navItems = [
  { href: routes.discover, label: 'Discover', icon: 'discover' as const },
  { href: routes.events, label: 'Events', icon: 'events' as const },
  { href: routes.organize, label: 'Organize', icon: 'organize' as const },
  { href: routes.tickets, label: 'Passes', icon: 'tickets' as const },
  { href: routes.profile, label: 'Profile', icon: 'profile' as const },
];

function BrandMark() {
  return (
    <div className="px-1">
      <BrandLogo variant="lockup" size="md" href={routes.discover} priority />
      <p className="mt-1.5 px-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
        Everything beyond the count
      </p>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors',
              active
                ? 'bg-transparent text-accent'
                : 'text-white/55 hover:bg-white/[0.04] hover:text-white/85',
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent"
              />
            ) : null}
            <ByndIcon
              name={item.icon}
              className={cn('size-[1.1rem]', active ? 'text-accent' : 'text-white/45')}
            />
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
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13px] font-medium text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/75"
        >
          <ByndIcon name="help" className="size-[1.1rem]" />
          Help & support
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Need help?</DialogTitle>
          <DialogDescription>
            BYND8 support covers discovery, registrations, tickets, and organizer setup. Reach us anytime —
            we build around the scene.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 rounded-md border border-border bg-elevated p-4 text-sm text-text-secondary">
          <p>
            Email: <span className="text-text-primary">support@bynd8.in</span>
          </p>
          <p className="text-xs leading-relaxed">
            <a
              href={LEGAL_URLS.terms}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-accent"
            >
              Terms
            </a>
            {' · '}
            <a
              href={LEGAL_URLS.privacy}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-accent"
            >
              Privacy
            </a>
            {' · '}
            <a
              href={LEGAL_URLS.refunds}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-accent"
            >
              Refunds
            </a>
          </p>
        </div>
        <DialogFooter>
          <Button asChild>
            <a href="mailto:support@bynd8.in">
              <ByndIcon name="megaphone" />
              Email support
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-7 px-3 py-5">
      <BrandMark />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto">
        <SupportSlot />
      </div>
    </div>
  );
}

/** Narrow desktop rail — ~15% of a 1440 frame ≈ 200–220px. */
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[13.5rem] shrink-0 border-r border-white/[0.06] bg-[#0A0A0A] lg:flex lg:flex-col xl:w-[14.5rem]">
      <SidebarBody />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex shrink-0 items-center lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Open menu"
            className="size-10 border-white/15 bg-[#121212]"
          >
            <ByndIcon name="menu" className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(100%,17rem)] border-white/[0.06] bg-[#0A0A0A] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>BYND8</SheetTitle>
          </SheetHeader>
          <div className="border-b border-white/[0.06] px-3 py-4">
            <BrandLogo variant="mark" size="sm" href={routes.discover} />
          </div>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
