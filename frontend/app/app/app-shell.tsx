"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppNavbar } from "@/components/shell/AppNavbar";
import { MobileTabBar } from "@/components/shell/MobileTabBar";
import { useSideQuest } from "@/contexts/sidequest-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, backendUser, isOnboardingComplete } = useSideQuest();
  const router = useRouter();
  const pathname = usePathname();
  const isImmersiveHome = pathname === "/app" || pathname === "/app/";

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !backendUser) {
      return;
    }

    const inOnboarding = pathname.startsWith("/app/onboarding");

    if (!isOnboardingComplete && !inOnboarding) {
      router.replace("/app/onboarding");
      return;
    }

    if (isOnboardingComplete && inOnboarding) {
      router.replace("/app");
    }
  }, [backendUser, isLoaded, isOnboardingComplete, isSignedIn, pathname, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isImmersiveHome) {
    return <>{children}</>;
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
