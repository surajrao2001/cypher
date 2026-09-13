import Link from 'next/link';

import { ByndIcon } from '@/components/icons/bynd8';
import { cn } from '@/lib/utils';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageBreadcrumb({
  items,
  tone = 'muted',
  className,
}: {
  items: BreadcrumbItem[];
  tone?: 'muted' | 'accent';
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  const parent = [...items].reverse().find((item) => item.href) ?? items[0];
  const trail = items.filter((item) => item.label);
  const accent = tone === 'accent';

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-6', className)}>
      {parent?.href ? (
        <Link
          href={parent.href}
          className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent md:hidden"
        >
          <ByndIcon name="chevronLeft" className="size-4" />
          {parent.label}
        </Link>
      ) : null}

      <ol
        className={cn(
          'hidden flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] md:flex',
          accent ? 'text-accent' : 'text-text-muted',
        )}
      >
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${String(index)}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className={accent ? 'text-accent/60' : undefined}>
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? (accent ? 'text-accent' : 'text-text-secondary') : undefined
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
