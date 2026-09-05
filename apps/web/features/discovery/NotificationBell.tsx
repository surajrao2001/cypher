'use client';

import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownContent,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown';

export function NotificationBell() {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 bg-surface" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-80 p-0">
        <DropdownLabel className="px-3 py-2.5">Notifications</DropdownLabel>
        <DropdownSeparator />
        <div className="px-3 py-8 text-center">
          <p className="text-sm font-semibold text-text-primary">Nothing new</p>
          <p className="mt-1 text-xs normal-case tracking-normal text-text-secondary">
            Registration and ticket updates will show up here when they land.
          </p>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
