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
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthSlotLoading } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

const navItems = [
  { href: routes.discover, label: 'Discover', icon: 'discover' as const },
  { href: routes.events, label: 'Events', icon: 'events' as const },
  { href: routes.organize, label: 'Organize', icon: 'organize' as const },
  { href: routes.tickets, label: 'Tickets', icon: 'tickets' as const },
  { href: routes.profile, label: 'Profile', icon: 'profile' as const },
];

function BrandMark() {
  return (
    <div className="px-1">
      <BrandLogo variant="lockup" size="md" href={routes.discover} />
      <p className="kicker mt-2 px-0.5 text-[10px]">Everything beyond the count</p>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
            <ByndIcon
              name={item.icon}
              className={cn('size-[1.15rem]', active ? 'text-accent' : 'text-text-muted')}
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
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 normal-case tracking-normal">
          <ByndIcon name="help" className="size-[1.15rem] text-text-muted" />
          Help & support
        </Button>
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

function AuthSlot({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth();
  const name = auth.me?.profile.dancerName ?? auth.me?.profile.name;

  if (auth.status === 'loading') {
    return <AuthSlotLoading />;
  }

  if (auth.status !== 'authenticated') {
    return (
      <Button asChild variant="default" className="w-full">
        <Link href={routes.login} onClick={onNavigate}>
          <ByndIcon name="signIn" />
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <Link
      href={routes.profile}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary"
    >
      <ByndIcon name="profile" className="size-[1.15rem] text-accent" />
      <span className="min-w-0">
        <span className="kicker block text-[10px] text-accent">Signed in</span>
        <span className="truncate">{name ?? 'Dancer'}</span>
      </span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <BrandMark />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-3">
        <SupportSlot />
        <AuthSlot onNavigate={onNavigate} />
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
    <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2 lg:hidden">
      <BrandLogo variant="mark" size="sm" href={routes.discover} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <ByndIcon name="menu" className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>BYND8</SheetTitle>
          </SheetHeader>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
