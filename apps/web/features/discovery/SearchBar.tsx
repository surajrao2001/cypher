'use client';

import { ChevronDown, MapPin, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
} from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import { CITIES } from '@/features/discovery/catalog';
import { useDiscoverQuery } from '@/features/discovery/use-discover-query';

export function SearchBar() {
  const { searchParams, setParams } = useDiscoverQuery();
  const city = searchParams.get('city') ?? 'all';
  const query = searchParams.get('q') ?? '';

  return (
    <form
      className="flex min-w-0 flex-1 items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const q = String(form.get('q') ?? '').trim();
        setParams({ q: q || null });
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          name="q"
          defaultValue={query}
          key={query}
          placeholder="Search battles, crews, venues…"
          className="h-11 border-border bg-surface pl-10"
          aria-label="Search events"
        />
      </div>
      <Dropdown>
        <DropdownTrigger asChild>
          <Button
            variant="outline"
            className="h-11 shrink-0 gap-2 border-border bg-surface px-3 normal-case tracking-normal"
          >
            <MapPin className="h-4 w-4 text-accent" />
            <span className="hidden max-w-28 truncate font-medium sm:inline">
              {city === 'all' ? 'All cities' : city}
            </span>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </Button>
        </DropdownTrigger>
        <DropdownContent align="end" className="w-44">
          <DropdownLabel>City</DropdownLabel>
          <DropdownItem onSelect={() => setParams({ city: null })}>All cities</DropdownItem>
          {CITIES.map((item) => (
            <DropdownItem key={item} onSelect={() => setParams({ city: item })}>
              {item}
            </DropdownItem>
          ))}
        </DropdownContent>
      </Dropdown>
    </form>
  );
}
