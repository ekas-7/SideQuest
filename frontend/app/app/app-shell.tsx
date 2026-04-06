"use client";

import { AppNavbar } from "@/components/shell/AppNavbar";
import { useSideQuest } from "@/contexts/sidequest-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useSideQuest();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <>
      <AppNavbar isSignedIn={isSignedIn} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-2 sm:px-6">{children}</main>
    </>
  );
}
