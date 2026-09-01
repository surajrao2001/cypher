'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDiscoverQuery } from '@/features/discovery/use-discover-query';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'battle', label: 'Battles' },
  { value: 'jam', label: 'Jams' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'showcase', label: 'Showcases' },
] as const;

export function EventTypeTabs() {
  const { searchParams, setParams } = useDiscoverQuery();
  const value = searchParams.get('type') ?? 'all';

  return (
    <Tabs value={value} onValueChange={(next) => setParams({ type: next })}>
      <TabsList aria-label="Event types">
        {TYPES.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
