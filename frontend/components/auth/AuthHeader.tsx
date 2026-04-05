"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthHeader() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-end gap-3 px-6 py-4 sm:px-8">
      <Show when="signed-out">
        <SignInButton>
          <Button className="h-auto rounded-full border border-border bg-secondary px-5 py-2.5 text-sm text-foreground hover:scale-[1.02]">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton>
          <Button className="h-auto rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground hover:scale-[1.02]">
            Sign up
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  );
}
