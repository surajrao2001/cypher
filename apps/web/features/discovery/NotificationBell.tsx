'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown';
import { mockNotifications } from '@/features/discovery/mock-events';

export function NotificationBell() {
  const unread = mockNotifications.filter((item) => item.unread).length;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-11 w-11 bg-surface" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <Badge
              variant="default"
              className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center px-1 text-[10px] tracking-normal"
            >
              {unread}
            </Badge>
          ) : null}
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-80 p-0">
        <DropdownLabel className="px-3 py-2.5">Notifications</DropdownLabel>
        <DropdownSeparator />
        {mockNotifications.map((item) => (
          <DropdownItem key={item.id} asChild className="items-start gap-3 rounded-none px-3 py-3">
            <Link href={item.href}>
              {item.unread ? (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              ) : (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
              )}
              <span className="min-w-0">
                <span className="block font-semibold leading-tight">{item.title}</span>
                <span className="mt-0.5 block text-xs normal-case tracking-normal text-text-secondary">
                  {item.body}
                </span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  {item.time}
                </span>
              </span>
            </Link>
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
