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
      <div className="mx-auto grid max-w-lg grid-cols-2 items-end gap-2">
  {sideTabs.map(({ href, label, match, icon }) => {
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
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
