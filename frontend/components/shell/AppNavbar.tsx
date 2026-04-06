"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Home" },
  { href: "/app/quests", label: "Weekly quests" },
  { href: "/app/verify", label: "Verify" },
] as const;

export function AppNavbar({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 px-4 pb-2 pt-4 sm:px-6">
      <nav
        className="liquid-glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2.5 sm:px-5"
        aria-label="Main"
      >
        <Link
          href="/"
          className="shrink-0 font-[family-name:var(--font-display)] text-xl tracking-tight text-foreground sm:text-2xl"
        >
          SideQuest
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label }) => {
            const active = pathname === href || (href !== "/app" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/app/quests" className="hidden sm:block">
            <Button
              type="button"
              className="h-auto rounded-full px-4 py-2 text-sm"
              variant="default"
            >
              Start quest
            </Button>
          </Link>

          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <Button type="button" variant="secondary" className="h-auto rounded-full px-4 py-2 text-sm">
                Sign in
              </Button>
            </SignInButton>
          )}

          <button
            type="button"
            className="rounded-lg border border-border/80 p-2 text-muted-foreground md:hidden"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl md:hidden">
          <div className="liquid-glass flex flex-col gap-1 rounded-2xl p-3">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-3 py-2.5 text-sm text-foreground"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link href="/app/quests" onClick={() => setOpen(false)}>
              <span className="mt-1 block rounded-xl bg-primary px-3 py-2.5 text-center text-sm text-primary-foreground">
                Start quest
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
