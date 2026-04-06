"use client";

import { AppNavbar } from "@/components/shell/AppNavbar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { useSideQuest } from "@/contexts/sidequest-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useSideQuest();

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <>
      <AppNavbar isSignedIn={isSignedIn} />
      <main className="mx-auto max-w-6xl px-4 pt-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-10">
        {children}
      </main>
      <MobileTabBar />
    </>
  );
}
