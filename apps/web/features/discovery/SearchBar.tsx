'use client';

import { ByndIcon } from '@/components/icons/bynd8';
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
        <ByndIcon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40"
        />
        <Input
          name="q"
          defaultValue={query}
          key={query}
          placeholder="Search battles, crews, venues…"
          className="h-10 rounded-md border-transparent bg-[#171717] pl-10 text-[13px] text-white placeholder:text-white/40 focus-visible:border-white/15 focus-visible:ring-0"
          aria-label="Search events"
        />
      </div>
      <Dropdown>
        <DropdownTrigger asChild>
          <Button
            variant="outline"
            className="h-10 shrink-0 gap-1.5 rounded-full border-white/15 bg-[#171717] px-3 text-[13px] font-medium normal-case tracking-normal text-white/85 hover:bg-[#1c1c1c]"
          >
            <ByndIcon name="pin" className="size-3.5 text-accent" />
            <span className="hidden max-w-[7.5rem] truncate sm:inline">
              {city === 'all' ? 'All cities' : city}
            </span>
            <ByndIcon name="chevronDown" className="size-3.5 text-white/40" />
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
