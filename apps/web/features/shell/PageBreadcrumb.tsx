import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) {
    return null;
  }

  const parent = [...items].reverse().find((item) => item.href) ?? items[0];
  const trail = items.filter((item) => item.label);

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      {parent?.href ? (
        <Link
          href={parent.href}
          className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent md:hidden"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {parent.label}
        </Link>
      ) : null}

      <ol className="hidden flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-text-muted md:flex">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${String(index)}`} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-text-secondary' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
