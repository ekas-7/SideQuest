"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { VerificationReviewCard } from "@/components/verify/VerificationReviewCard";
import { useSideQuest } from "@/contexts/sidequest-context";

export default function VerifyPage() {
  const {
    isLoaded,
    isSignedIn,
    backendUser,
    assignments,
    assignmentsError,
    isAssignmentsLoading,
    loadAssignments,
    votePendingByJobId,
    voteStatusByJobId,
    handleVote,
  } = useSideQuest();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <GlassPanel className="animate-fade-rise mt-6">
        <p className="text-muted-foreground">Sign in to review the verification queue.</p>
        <SignInButton mode="modal">
          <Button type="button" className="mt-4 rounded-full">
            Sign in
          </Button>
        </SignInButton>
      </GlassPanel>
    );
  }

  if (!backendUser) {
    return (
      <GlassPanel className="animate-fade-rise mt-6">
        <p className="text-muted-foreground">Finish profile setup on the home tab.</p>
        <Link href="/app" className="mt-4 inline-block">
          <Button type="button" variant="secondary" className="rounded-full">
            Go to home
          </Button>
        </Link>
      </GlassPanel>
    );
  }

  const pendingForYou = assignments.filter(
    (a) => a.jobStatus === "pending" && a.vote === null
  );

  return (
    <div className="space-y-6 pt-4">
      <div className="animate-fade-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
            Verify
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Review proof from other players. Your votes keep the community honest.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-fit rounded-full"
          onClick={() => void loadAssignments()}
          disabled={isAssignmentsLoading}
        >
          {isAssignmentsLoading ? "Refreshing…" : "Refresh queue"}
        </Button>
      </div>

      <GlassPanel className="animate-fade-rise-delay py-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{pendingForYou.length}</span> open{" "}
          {pendingForYou.length === 1 ? "assignment" : "assignments"} need your vote.
        </p>
      </GlassPanel>

      {assignmentsError && (
        <p className="text-sm text-red-300">{assignmentsError}</p>
      )}

      {!assignmentsError && !isAssignmentsLoading && assignments.length === 0 && (
        <GlassPanel>
          <p className="text-muted-foreground">Nothing in your queue right now.</p>
        </GlassPanel>
      )}

      <div className="flex flex-col gap-5">
        {assignments.map((assignment, index) => {
          const delayClass =
            index === 0
              ? "animate-fade-rise"
              : index === 1
                ? "animate-fade-rise-delay"
                : "animate-fade-rise-delay-2";
          return (
            <div key={assignment.id} className={delayClass}>
              <VerificationReviewCard
                assignment={assignment}
                isVotePending={votePendingByJobId[assignment.jobId] ?? false}
                voteStatus={voteStatusByJobId[assignment.jobId]}
                onApprove={() => void handleVote(assignment.jobId, true)}
                onReject={() => void handleVote(assignment.jobId, false)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
