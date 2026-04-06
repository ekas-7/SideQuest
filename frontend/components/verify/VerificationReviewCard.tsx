"use client";

import { Button } from "@/components/ui/button";
import { CardBody, CardHeader, CardShell } from "@/components/ui/card-shell";
import type { VerificationAssignment } from "@/lib/api";
import { cn } from "@/lib/utils";

function jobBadge(status: VerificationAssignment["jobStatus"]) {
  switch (status) {
    case "pending":
      return "border-amber-500/40 bg-amber-500/10 text-amber-100";
    case "approved":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "rejected":
      return "border-red-400/40 bg-red-500/10 text-red-200";
    default:
      return "border-border/80 text-muted-foreground";
  }
}

export function VerificationReviewCard({
  assignment,
  isVotePending,
  voteStatus,
  onApprove,
  onReject,
}: {
  assignment: VerificationAssignment;
  isVotePending: boolean;
  voteStatus?: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const alreadyVoted = assignment.vote !== null;
  const canVote = assignment.jobStatus === "pending" && !alreadyVoted;

  return (
    <CardShell interactive>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-medium tracking-tight text-foreground">
            {assignment.questTitle}
          </h3>
          <span className={cn("sq-badge shrink-0", jobBadge(assignment.jobStatus))}>
            {assignment.jobStatus}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          @{assignment.submitterUsername}
          {assignment.submittedAt && (
            <span className="text-muted-foreground/70">
              {" "}
              · {new Date(assignment.submittedAt).toLocaleString()}
            </span>
          )}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Job #{assignment.jobId} · {assignment.requiredVotes} votes required
        </p>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,240px)_1fr]">
          <div className="sq-media-frame aspect-square max-h-56 w-full sm:max-h-none">
            {assignment.proofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- API-hosted proof URL
              <img
                src={assignment.proofUrl}
                alt={`Proof for ${assignment.questTitle}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[160px] items-center justify-center p-4 text-center text-sm text-muted-foreground">
                No image on file
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            {assignment.proofDescription && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Caption
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{assignment.proofDescription}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              <span className="text-foreground/90">Your vote:</span>{" "}
              {assignment.vote === null
                ? "not cast"
                : assignment.vote
                  ? "approve"
                  : "reject"}
            </p>

            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                className="h-auto rounded-full px-5 py-2"
                disabled={!canVote || isVotePending}
                onClick={onApprove}
              >
                {isVotePending ? "Sending…" : "Approve"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-auto rounded-full px-5 py-2"
                disabled={!canVote || isVotePending}
                onClick={onReject}
              >
                Reject
              </Button>
            </div>
            {voteStatus && <p className="text-sm text-muted-foreground">{voteStatus}</p>}
          </div>
        </div>
      </CardBody>
    </CardShell>
  );
}
