"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sideTabs = [
  {
    href: "/app",
    label: "Home",
    match: (path: string) => path === "/app" || path === "/app/",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z"
        />
      </svg>
    ),
  },
  {
    href: "/app/verify",
    label: "Verify",
    match: (path: string) => path.startsWith("/app/verify"),
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-lg grid-cols-[1fr_auto_1fr] items-end gap-2">
        {sideTabs.map(({ href, label, match, icon }, idx) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[48px] min-w-[48px] touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
              style={{ gridColumn: idx === 0 ? 1 : 3 }}
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}

        <Link
          href="/app/quests"
          className={cn(
            "mb-1 inline-flex h-16 w-16 touch-manipulation items-center justify-center justify-self-center rounded-full border border-primary/35 bg-primary/20 text-primary shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.55)] transition",
            pathname.startsWith("/app/quests")
              ? "scale-105 bg-primary/25"
              : "active:scale-95"
          )}
          aria-label="Open quests"
          aria-current={pathname.startsWith("/app/quests") ? "page" : undefined}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
