import { type ReactNode, Suspense } from 'react';

import { NotificationBell } from '@/features/discovery/NotificationBell';
import { SearchBar } from '@/features/discovery/SearchBar';
import { AppSidebar, MobileNav } from '@/features/navigation/AppSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

function SearchBarFallback() {
  return <div className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface" />;
}

export default function AppShellLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh bg-bg">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-bg/85 px-3 py-3 backdrop-blur-md md:px-6">
            <MobileNav />
            <Suspense fallback={<SearchBarFallback />}>
              <SearchBar />
            </Suspense>
            <NotificationBell />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
