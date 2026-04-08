"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { StatPills } from "@/components/dashboard/StatPills";
import { useSideQuest } from "@/contexts/sidequest-context";

export default function AppHomePage() {
  const {
    isLoaded,
    isSignedIn,
    backendUser,
    registrationError,
    registrationSuccess,
    isRegistering,
    handleRegisterUser,
    weeklyData,
    assignments,
    isOnboardingComplete,
    onboardingInterests,
    suggestedSideQuests,
  } = useSideQuest();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <div className="animate-fade-rise space-y-8 pt-6">
        <GlassPanel>
          <h1
            className="font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl"
          >
            Your life game interface
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Sign in to claim your username, pull this week&apos;s quests, upload proof, and vote
            on the community queue.
          </p>
          <div className="mt-6">
            <SignInButton mode="modal">
              <Button type="button" className="h-auto rounded-full px-8 py-3 text-sm">
                Sign in to continue
              </Button>
            </SignInButton>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-4">
      <header className="animate-fade-rise">
        <h1
          className="font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl"
        >
          {backendUser ? `Welcome back, @${backendUser.username}` : "Set up your adventurer"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {weeklyData?.weekStart
            ? `Week of ${weeklyData.weekStart}. Complete quests, submit proof, then help verify others.`
            : "Connect your account to load this week’s quests."}
        </p>
      </header>

      {!backendUser && (
        <GlassPanel className="animate-fade-rise-delay">
          <h2 className="text-lg font-medium text-foreground">Syncing your profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We use your Clerk account as the single sign-in and set up your SideQuest profile automatically.
          </p>
          <div className="mt-4 flex max-w-md flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {isRegistering ? "Creating your SideQuest profile…" : "Profile setup is taking longer than expected."}
            </p>
            {!isRegistering && (
              <Button
                type="button"
                className="h-auto w-fit rounded-full px-6 py-2.5"
                onClick={() => void handleRegisterUser()}
              >
                Retry setup
              </Button>
            )}
          </div>
          {registrationError && (
            <p className="mt-3 text-sm text-red-300">{registrationError}</p>
          )}
          {registrationSuccess && (
            <p className="mt-3 text-sm text-primary">{registrationSuccess}</p>
          )}
        </GlassPanel>
      )}

      {backendUser && (
        <>
          {isOnboardingComplete && (
            <GlassPanel className="animate-fade-rise-delay">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-medium text-foreground">Suggested side quests</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Based on your interests: {onboardingInterests.join(", ")}
                  </p>
                </div>
                <Link href="/app/onboarding" className="w-fit">
                  <Button type="button" variant="secondary" className="h-auto rounded-full px-4 py-2 text-sm">
                    Edit interests
                  </Button>
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {suggestedSideQuests.map((quest) => (
                  <div
                    key={`${quest.difficulty}-${quest.interest}`}
                    className="rounded-xl border border-border/70 bg-secondary/35 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {quest.difficulty}
                    </p>
                    <h3 className="mt-1 text-base font-medium text-foreground">{quest.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Interest: {quest.interest}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{quest.description}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="animate-fade-rise-delay lg:col-span-1">
              <StreakCard user={backendUser} />
            </div>
            <GlassPanel className="animate-fade-rise-delay-2 lg:col-span-2">
              <h2 className="text-lg font-medium text-foreground">Character sheet</h2>
              <p className="mt-1 text-sm text-muted-foreground">Stats grow when quests are verified.</p>
              <div className="mt-4">
                <StatPills user={backendUser} />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/app/quests">
                  <Button type="button" className="h-auto rounded-full px-5 py-2.5">
                    Weekly quests
                  </Button>
                </Link>
                <Link href="/app/verify">
                  <Button type="button" variant="secondary" className="h-auto rounded-full px-5 py-2.5">
                    Verify queue ({assignments.filter((a) => a.jobStatus === "pending" && a.vote === null).length})
                  </Button>
                </Link>
              </div>
            </GlassPanel>
          </div>

          <GlassPanel>
            <h2 className="text-lg font-medium">This week at a glance</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                Active quests:{" "}
                <span className="text-foreground">
                  {weeklyData?.quests.filter((q) => q.status === "assigned" || q.status === "rejected").length ?? "—"}
                </span>
              </li>
              <li>
                Awaiting verification:{" "}
                <span className="text-foreground">
                  {weeklyData?.quests.filter((q) => q.status === "submitted").length ?? "—"}
                </span>
              </li>
              <li>
                Open votes for you:{" "}
                <span className="text-foreground">
                  {assignments.filter((a) => a.jobStatus === "pending" && a.vote === null).length}
                </span>
              </li>
            </ul>
          </GlassPanel>
        </>
      )}
    </div>
  );
}
