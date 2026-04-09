"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [{ href: "/app", label: "Home" }] as const;

export function AppNavbar({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <nav
        className="liquid-glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2.5 sm:px-5"
        aria-label="Main"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 shrink-0 touch-manipulation items-center font-[family-name:var(--font-display)] text-xl leading-none tracking-tight text-foreground sm:min-h-0 sm:text-2xl"
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
          {isSignedIn ? (
            <>
              <SignOutButton>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 min-w-11 touch-manipulation rounded-full px-4 py-2 text-sm sm:h-auto sm:min-w-0"
                >
                  Logout
                </Button>
              </SignOutButton>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <Button
                type="button"
                variant="secondary"
                className="h-11 min-w-11 touch-manipulation rounded-full px-4 py-2 text-sm sm:h-auto sm:min-w-0"
              >
                Sign in
              </Button>
            </SignInButton>
          )}
        </div>
      </nav>
    </header>
  );
}
