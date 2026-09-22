import { type ReactNode, Suspense } from 'react';

import { DiscoverQueryProvider } from '@/features/discovery/use-discover-query';
import { AppSidebar, MobileBottomNav } from '@/features/navigation/AppSidebar';
import { TopUtilityBar } from '@/features/navigation/TopUtilityBar';
import { TooltipProvider } from '@/components/ui/tooltip';

function TopBarFallback() {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="h-10 min-w-0 flex-1 rounded-md bg-[#171717]" />
      <div className="h-10 w-28 rounded-full bg-[#171717]" />
      <div className="h-10 w-20 rounded-md bg-[#171717]" />
    </div>
  );
}

export default function AppShellLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <TooltipProvider delayDuration={200}>
      <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
        <DiscoverQueryProvider>
          <div className="flex min-h-dvh bg-[#080808]">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/[0.06] bg-[#080808]/95 px-3 py-2.5 backdrop-blur-md sm:gap-3 md:px-5 lg:px-6">
                <Suspense fallback={<TopBarFallback />}>
                  <TopUtilityBar />
                </Suspense>
              </header>
              {/* Bottom padding clears fixed mobile tab bar */}
              <main className="flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
                {children}
              </main>
            </div>
          </div>
          <MobileBottomNav />
        </DiscoverQueryProvider>
      </Suspense>
    </TooltipProvider>
  );
}
