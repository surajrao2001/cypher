'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { FOR_YOU_TAGS } from '@/features/discovery/mock-events';
import { useDiscoverQuery } from '@/features/discovery/use-discover-query';

export function ForYouTags() {
  const reduceMotion = useReducedMotion();
  const { searchParams, setParams } = useDiscoverQuery();
  const active = searchParams.get('tag');

  return (
    <div>
      <p className="kicker mb-3">For you</p>
      <div className="flex flex-wrap gap-2">
        {FOR_YOU_TAGS.map((tag) => {
          const selected = active === tag;
          return (
            <motion.button
              key={tag}
              type="button"
              whileHover={reduceMotion ? undefined : { scale: 1.05 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={() => setParams({ tag: selected ? null : tag })}
              className={
                selected
                  ? 'rounded-sm bg-accent-2 px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-bg'
                  : 'rounded-sm bg-accent-2/15 px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-2 ring-1 ring-accent-2/30 hover:bg-accent-2/25'
              }
            >
              #{tag.replaceAll(' ', '')}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
